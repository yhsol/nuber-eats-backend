import { Test } from '@nestjs/testing';
import { send } from 'process';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import * as FormData from 'form-data';
import got from 'got';

jest.mock('got');
jest.mock('form-data');

const TEST_DOMAIN = 'test-domain';

describe('MailService', () => {
  let service: MailService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test-apiKey',
            domain: 'test-domain',
            fromEmail: 'test-fromEmail',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', async () => {
      const sendVerificationArgs = {
        email: 'email',
        code: 'code',
      };

      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      service.sendVerificationEmail({
        email: sendVerificationArgs.email,
        code: sendVerificationArgs.code,
      });
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith({
        subject: 'testing',
        template: 'verify-email',
        to: 'loshy244110@gmail.com',
        emailVariables: [
          { key: 'v:username', value: sendVerificationArgs.email },
          { key: 'v:code', value: sendVerificationArgs.code },
        ],
      });
    });
  });
  describe('sendEmail', () => {
    it('sends email', async () => {
      const ok = await service.sendEmail({
        subject: '',
        template: '',
        to: '',
        emailVariables: [{ key: 'one', value: 'more' }],
      });
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalled();
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(ok).toEqual(true);
    });
    it('fails on error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const ok = await service.sendEmail({
        subject: '',
        template: '',
        to: '',
        emailVariables: [{ key: 'one', value: 'more' }],
      });
      expect(ok).toEqual(false);
    });
  });
});
