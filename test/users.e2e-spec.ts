import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = `/graphql`;

const TEST_USER_DICTIONARY = {
  email: 'e2etest@test.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('x-jwt', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    verificationRepository = moduleFixture.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
            mutation {
              createAccount(
                input: { email: "${TEST_USER_DICTIONARY.email}", password: "${TEST_USER_DICTIONARY.password}", role: Client }
              ) {
                ok
                error
              }
            }       
        `)
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exist', () => {
      return publicTest(`
      mutation {
        createAccount(
          input: { email: "${TEST_USER_DICTIONARY.email}", password: "${TEST_USER_DICTIONARY.password}", role: Client }
        ) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(expect.any(String));
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`mutation {
        login(input: {
          email: "${TEST_USER_DICTIONARY.email}",
          password: "${TEST_USER_DICTIONARY.password}"
        }) {
          ok
          error
          token
        }
      }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
      mutation {
        login(input: {
          email: "${TEST_USER_DICTIONARY.email}",
          password: "wrong password"
        }) {
          ok
          error
          token
        }
      }
  `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(`
      {
        userProfile(userId: ${userId}) {
          ok
          error
          user {
            id
          }
        }
      }          
    `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it("should not find user's profile", () => {
      return privateTest(`
      {
        userProfile(userId: 0) {
          ok
          error
          user {
            id
          }
        }
      }          
    `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should found my profile', () => {
      return privateTest(`
      {
        me {
          id
          email
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;

          expect(email).toBe(TEST_USER_DICTIONARY.email);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
      {
        me {
          id
          email
        }
      }
    `)
        .expect(200)
        .expect(res => {
          const [error] = res.body.errors;
          const { message } = error;
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'test@email.com';
    it('should change email', () => {
      return privateTest(`
      mutation {
        editProfile(input: {email: "${NEW_EMAIL}"}) {
          ok,
          error
        }
      }
    `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should change email to newEmail in profile', () => {
      return privateTest(`
      {
        me {
          id
          email
        }
      }
    `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;

          expect(email).toBe(NEW_EMAIL);
        });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
      mutation {
        verifyEmail(input: {code: "${verificationCode}"}) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on not found verification code', () => {
      return publicTest(`
      mutation {
        verifyEmail(input: {code: "wrong code"}) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('Verification Not Found');
        });
    });
  });
});
