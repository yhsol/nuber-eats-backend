import { Test } from '@nestjs/testing';
import { send } from 'process';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

jest.mock('got', () => {});
jest.mock('form-data', () => {
  return {
    append: jest.fn(),
  };
});

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

      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
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
  it.todo('sendEmail');
});
