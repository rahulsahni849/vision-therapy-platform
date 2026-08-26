import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions } from '../email.interface';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private resend: any;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'V-One <noreply@v-one.app>');

    if (apiKey) {
      import('resend').then(({ Resend }) => {
        this.resend = new Resend(apiKey);
      });
    } else {
      this.logger.warn('RESEND_API_KEY not set. Emails will be logged only.');
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, from } = options;

    if (!this.resend) {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}`);
      return;
    }

    await this.resend.emails.send({
      from: from || this.fromEmail,
      to,
      subject,
      html,
    });
  }
}
