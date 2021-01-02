import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
  ) {}

  // createAccount
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    try {
      const exists = await this.usersRepository.findOne({ email });
      if (exists) {
        console.error('users.service.ts: already exists!');
        return { ok: false, error: 'There is a user with that email already' };
      }

      const user = await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );

      // TODO: logic for verification
      await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );

      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error: "Couldn't create account" };
    }
  }

  // login
  /**
   *
   * TODO:
   * 1. make a JWT and give it to the user
   */
  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      const user = await this.usersRepository.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }

      // const token = jwt.sign({ id: user.id }, this.config.get('SECRET_KEY'));
      const token = this.jwtService.sign({ id: user.id });
      return {
        ok: true,
        token,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.usersRepository.findOne({ id });
      if (user) {
        return { ok: true, user: user };
      }
    } catch (error) {
      return { ok: false, error: 'User NOt Found' };
    }
  }

  async editProfile(
    userId: number,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const { email, password } = editProfileInput;
      const user = await this.usersRepository.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verifications.save(this.verifications.create({ user }));
      }
      if (password) {
        user.password = password;
      }
      await this.usersRepository.save(user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.usersRepository.save(verification.user);
        await this.verifications.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: 'Verification Not Found' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
