import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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

    // create user & hash the password
  }
}
