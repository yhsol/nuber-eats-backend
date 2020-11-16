import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {
    console.log(this.config.get('SECRET_KEY'));
  }

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

      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
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
   * 1. check if the password is correct
   * 2. make a JWT and give it to the user
   */
  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      const user = await this.usersRepository.findOne({ email });
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

      const token = jwt.sign({ id: user.id }, this.config.get('SECRET_KEY'));
      return {
        ok: true,
        token: 'testtoken',
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }
}
