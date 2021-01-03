export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

export interface EmailVariable {
  key: string;
  value: string;
}
