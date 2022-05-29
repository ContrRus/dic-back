import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {compareSync} from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {DataBaseMongoDataSource} from '../datasources';
import {User, UserRelations} from '../models';

// const {secret} = require('../../secretConfig');
const secret = 'oEii1xlx1Dn6MonA6Ra2';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype._id,
  UserRelations
> {
  constructor(
    @inject('datasources.dataBaseMongo') dataSource: DataBaseMongoDataSource,
  ) {
    super(User, dataSource);
  }
  login(user: User) {
    return this.find({where: {email: user.email}}).then(async res => {
      if (res.length > 0) {
        for (const us of res) {
          console.log('us.password', us.password);
          console.log('user.password', user.password);
          console.log('user.password.length', us.password.length);

          const isPasswordHashed = us.password.length >= 50;
          console.log('isPasswordHashed', isPasswordHashed);

          // const hashedPass = await hash(user.password, await genSalt());
          // console.log('hashedPass, ', hashedPass);

          if (
            isPasswordHashed
              ? compareSync(user.password, us.password)
              : us.password === user.password
          ) {
            const token = generateAccessToken(us);
            console.log(token);
            console.log('user', us);

            return {
              loginStatus: 'Ok',
              token,
              // user: us,
            };
          }
          return {
            loginStatus: 'Wrong password',
          };
        }
      }
      return {
        loginStatus: 'User is not found',
      };
    });
  }
}

const generateAccessToken = (user: User) => {
  const payload = {
    user,
  };
  return jwt.sign(payload, secret, {expiresIn: '3h'});
};
