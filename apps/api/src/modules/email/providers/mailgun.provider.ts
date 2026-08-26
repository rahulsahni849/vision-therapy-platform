import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions } from '../email.interface';

@Injectable()
export class MailgunProvider implements EmailProvider {
  private readonly logger = new Logger(MailgunProvider.name);
  private mg: any;
  private fromEmail: string;
  private domain: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    this.domain = this.configService.get<string>('MAILGUN_DOMAIN', '');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@v-one.app');

    if (apiKey && this.domain) {
      const FormData = require('form-data');
      const Mailgun = require('mailgun.js');
      const mailgun = new Mailgun(FormData);
      this.mg = mailgun.client({
        username: 'api',
        key: apiKey,
      });
    } else {
      this.logger.warn('MAILGUN_API_KEY or MAILGUN_DOMAIN not set. Emails will be logged only.');
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, from } = options;

    if (!this.mg) {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}`);
      return;
    }

    const result = await this.mg.messages.create(this.domain, {
      from: from || this.fromEmail,
      to: [to],
      subject,
      html,
    });

    this.logger.log(`Email sent successfully: ${result.id}`);
    return result;
  }
}
