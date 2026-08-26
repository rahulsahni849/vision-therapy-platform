import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions } from '../email.interface';

@Injectable()
export class BrevoProvider implements EmailProvider {
  private readonly logger = new Logger(BrevoProvider.name);
  private apiInstance: any;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@v-one.app');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'V-One');

    if (apiKey) {
      const brevo = require('@getbrevo/brevo');
      this.apiInstance = new brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    } else {
      this.logger.warn('BREVO_API_KEY not set. Emails will be logged only.');
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, from } = options;

    if (!this.apiInstance) {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}`);
      return;
    }

    const sendSmtpEmail = {
      sender: { email: from || this.fromEmail, name: this.fromName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }
}
