import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {createTransport} from 'nodemailer';
import {EmailTemplate, User} from '../models';

@bind({scope: BindingScope.TRANSIENT})
export class EmailService {
  /**
   * If using gmail see https://nodemailer.com/usage/using-gmail/
   */
  //
  private static async setupTransporter() {
    return createTransport({
      host: process.env.SMTP_SERVER ?? 'smtp.gmail.com',
      port: +process.env.SMTP_PORT! || 465,
      secure: true, // upgrade later with STARTTLS
      auth: {
        user: process.env.SMTP_USERNAME ?? 'knightn1ofamber@gmail.com',
        pass: process.env.SMTP_PASSWORD ?? 'cxvpwvsffhlcpapp',
      },
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendResetPasswordMail(user: User): Promise<any> {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = new EmailTemplate({
      to: user.email,
      subject: 'Dictionary Reset Password Request',
      html: `
      <div>
          <p>Hi there,</p>
          <p style="color: red;">We received a request to reset the password for your account</p>
          <p>To reset your password click on the link provided below</p>
          <a href="${
            process.env.APPLICATION_URL ?? `https://dict-front.herokuapp.com`
          }/reset-password-finish/${user.resetKey}">Reset your password link</a>
          <p>If you didn’t request to reset your password, please ignore this email or reset your password to protect your account.</p>
          <p>Thanks</p>
          <p>Dictionary app creator Ruslan</p>
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }
}
