import { Injectable, Inject } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS)
    private readonly options: MailModuleOptions,
  ) {
    this.sendEmail({
      subject: 'testing',
      template: 'verify-email',
      to: 'loshy244110@gmail.com',
    });
  }

  private async sendEmail({
    subject,
    template,
    to,
  }: {
    subject: string;
    template: string;
    to: string;
  }) {
    const form = new FormData();
    form.append('from', `Excited User <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    form.append('v:username', 'USERNAME_VARIABLE');
    form.append('v:code', 'confirmed');
    const response = await got(
      `https://api.mailgun.net/v3/${this.options.domain}/messages`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        method: 'POST',
        body: form,
      },
    );
    console.log('response.body: ', response.body);
  }
}
