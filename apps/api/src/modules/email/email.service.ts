import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions } from './email.interface';
import { ResendProvider } from './providers/resend.provider';
import { BrevoProvider } from './providers/brevo.provider';
import { MailgunProvider } from './providers/mailgun.provider';
import { ConsoleProvider } from './providers/console.provider';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private provider: EmailProvider;

  constructor(
    private configService: ConfigService,
    private resendProvider: ResendProvider,
    private brevoProvider: BrevoProvider,
    private mailgunProvider: MailgunProvider,
    private consoleProvider: ConsoleProvider,
  ) {
    const providerName = this.configService.get<string>('EMAIL_PROVIDER', 'console');

    switch (providerName) {
      case 'resend':
        this.provider = this.resendProvider;
        break;
      case 'brevo':
        this.provider = this.brevoProvider;
        break;
      case 'mailgun':
        this.provider = this.mailgunProvider;
        break;
      default:
        this.provider = this.consoleProvider;
    }

    this.logger.log(`Email provider: ${providerName}`);
  }

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.provider.send(options);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}:`);
      this.logger.error(`Message: ${error.message}`);
      this.logger.error(`Status: ${error.status}`);
      this.logger.error(`Details: ${JSON.stringify(error.response?.body || error.response || error, null, 2)}`);
    }
  }

  async sendInviteEmail(to: string, inviteLink: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    await this.send({
      to,
      subject: 'You\'re invited to V-One',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 40px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6066A7, #8181D9); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 30px; text-align: center; }
            .body p { color: #333; line-height: 1.6; }
            .btn { display: inline-block; padding: 14px 32px; background: #6066A7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>V-One</h1>
            </div>
            <div class="body">
              <p>You've been invited to join <strong>V-One Vision Therapy Platform</strong>.</p>
              <p>Click the button below to set your password and get started.</p>
              <a href="${inviteLink}" class="btn">Set Your Password</a>
              <p style="font-size: 12px; color: #999;">This link expires in 24 hours.</p>
            </div>
            <div class="footer">
              <p>V-One Vision Therapy Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
