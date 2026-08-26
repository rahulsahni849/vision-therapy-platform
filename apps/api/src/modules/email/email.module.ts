import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendProvider } from './providers/resend.provider';
import { BrevoProvider } from './providers/brevo.provider';
import { MailgunProvider } from './providers/mailgun.provider';
import { ConsoleProvider } from './providers/console.provider';

@Module({
  providers: [EmailService, ResendProvider, BrevoProvider, MailgunProvider, ConsoleProvider],
  exports: [EmailService],
})
export class EmailModule {}
