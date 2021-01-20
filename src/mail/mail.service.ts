import { Injectable, Inject } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailVariable, MailModuleOptions } from './mail.interfaces';

import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS)
    private readonly options: MailModuleOptions,
  ) {}

  async sendEmail({
    subject,
    template,
    to,
    emailVariables,
  }: {
    subject: string;
    template: string;
    to: string;
    emailVariables: EmailVariable[];
  }) {
    const form = new FormData();
    form.append('from', `Nuber Eats <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailVariables.forEach(eVar => form.append(eVar.key, eVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        method: 'POST',
        body: form,
      });
    } catch (error) {
      console.error(error);
    }
  }

  sendVerificationEmail({ email, code }: { email: string; code: string }) {
    this.sendEmail({
      subject: 'testing',
      template: 'verify-email',
      to: 'loshy244110@gmail.com',
      emailVariables: [
        { key: 'v:username', value: email },
        { key: 'v:code', value: code },
      ],
    });
  }
}
