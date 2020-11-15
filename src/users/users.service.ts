import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    try {
      const exists = await this.usersRepository.findOne({ email });
      if (exists) {
        console.error('users.service.ts: already exists!');
        return 'There is a user with that email already';
      }

      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
    } catch (error) {
      console.error(error);
      return "Couldn't create account";
    }

    // create user & hash the password
  }
}
