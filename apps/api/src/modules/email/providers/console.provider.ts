import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions } from '../email.interface';

@Injectable()
export class ConsoleProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleProvider.name);

  constructor(private configService: ConfigService) {}

  async send(options: SendEmailOptions): Promise<void> {
    this.logger.log(`[CONSOLE EMAIL] To: ${options.to}`);
    this.logger.log(`[CONSOLE EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[CONSOLE EMAIL] Body: ${options.html}`);
  }
}
