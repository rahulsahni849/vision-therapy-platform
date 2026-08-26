export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}
