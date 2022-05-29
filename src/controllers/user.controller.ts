import {UserRepository as UserRepositorySecurity} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';
import {KeyAndPassword, NodeMailer, ResetPasswordInit, User} from '../models';
import {UserRepository} from '../repositories';
import {EmailService} from '../services';

export class UserController {
  constructor(
    // @inject(TokenServiceBindings.TOKEN_SERVICE)
    // public jwtService: TokenService,
    // @inject(UserServiceBindings.USER_SERVICE)
    // public userService: MyUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @inject('services.EmailService')
    public emailService: EmailService,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserRepositorySecurity)
    public userRepositorySecurity: UserRepositorySecurity,
  ) {}

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['_id'],
          }),
        },
      },
    })
    user: User,
    // user: Omit<User, 'id'>,
  ): Promise<User | string | object | undefined> {
    console.log('user', user);
    user.password = await hash(user.password, await genSalt());

    const res = await this.userRepository.find({where: {email: user.email}});
    try {
      if (res.length > 0) {
        return {
          error: 'Duplicate of already existing user',
        };
      } else {
        return await this.userRepository.create(user);
      }
    } catch (error) {
      console.log(error);
    } finally {
      // return '';
    }
  }
  @post('/users/login')
  @response(204, {
    description: 'User login success',
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {}),
        },
      },
    })
    user: User,
  ): Promise<object> {
    return this.userRepository.login(user);
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(User) where?: Where<User>): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(User) filter?: Filter<User>): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>,
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    console.log('user ----', user);
    if (user.password) {
      user.password = await hash(user.password, await genSalt());
    }
    return this.userRepository.updateById(id, user);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.number('id') id: string,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @post('/users/reset-password/init')
  async resetPasswordInit(
    @requestBody() resetPasswordInit: ResetPasswordInit,
  ): Promise<string | object> {
    // checks whether email is valid as per regex pattern provided
    const email = await this.validateEmail(resetPasswordInit.email);

    // At this point we are dealing with valid email.
    // Lets check whether there is an associated account
    const foundUser = await this.userRepository.findOne({
      where: {email},
    });

    // No account found
    if (!foundUser) {
      throw new HttpErrors.NotFound(
        'No account associated with the provided email address.',
      );
    }

    // We generate unique reset key to associate with reset request
    foundUser.resetKey = uuidv4();

    try {
      // Updates the user to store their reset key with error handling
      await this.userRepository.updateById(foundUser._id, foundUser);
    } catch (e) {
      console.log('Error ----');

      return e;
    }
    // Send an email to the user's email address
    const nodeMailer: NodeMailer =
      await this.emailService.sendResetPasswordMail(foundUser);

    // Nodemailer has accepted the request. All good
    if (nodeMailer?.accepted?.length) {
      return {
        message: 'ok',
      };
      return 'An email with password reset instructions has been sent to the provided email';
    }

    // Nodemailer did not complete the request alert the user
    throw new HttpErrors.InternalServerError(
      'Error sending reset password email',
    );
  }

  async validateEmail(email: string): Promise<string> {
    const emailRegPattern = /\S+@\S+\.\S+/;
    if (!emailRegPattern.test(email)) {
      throw new HttpErrors.UnprocessableEntity('Invalid email address');
    }
    return email;
  }

  @put('/users/reset-password/finish')
  async resetPasswordFinish(
    @requestBody() keyAndPassword: KeyAndPassword,
  ): Promise<string | object> {
    // Checks whether password and reset key meet minimum security requirements
    const {resetKey, password} = await this.validateKeyPassword(keyAndPassword);
    console.log('resetKey ----', resetKey);
    console.log('password ----', password);

    // Search for a user using reset key
    const foundUser = await this.userRepository.findOne({
      where: {resetKey: resetKey},
    });

    // No user account found
    if (!foundUser) {
      throw new HttpErrors.NotFound(
        'No associated account for the provided reset key',
      );
    }

    // Encrypt password to avoid storing it as plain text
    const passwordHash = await hash(password!, await genSalt());

    try {
      // Update user password with the newly provided password
      foundUser.password = passwordHash;
      await this.userRepository.updateById(foundUser._id, foundUser);
      // await this.userRepositorySecurity
      //   .userCredentials(foundUser._id)
      //   .patch({password: passwordHash});

      // Remove reset key from database its no longer valid
      foundUser.resetKey = '';

      // Update the user removing the reset key
      await this.userRepository.updateById(foundUser._id, foundUser);
    } catch (e) {
      console.log('error ----');

      return e;
    }
    return {
      message: 'Password reset request completed successfully',
    };
    // return 'Password reset request completed successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validateKeyPassword(keyAndPassword: any): Promise<KeyAndPassword> {
    if (keyAndPassword.password.length < 6) {
      throw new HttpErrors.UnprocessableEntity(
        'Password must be minimum of 6 characters',
      );
    }

    if (
      keyAndPassword?.resetKey?.length === 0 ||
      keyAndPassword?.resetKey?.trim() === ''
    ) {
      throw new HttpErrors.UnprocessableEntity('Reset key is mandatory');
    }

    return keyAndPassword;
  }
}
