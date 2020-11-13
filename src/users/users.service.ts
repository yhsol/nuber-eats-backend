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

  async createAccount({ email, password, role }: CreateAccountInput) {
    try {
      // check new user
      const exists = await this.usersRepository.findOne({ email });
      if (exists) {
        console.error('users.service.ts: already exists!');
        return;
      }

      // create user and save
      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );

      return true;
    } catch (error) {
      // make error
      console.error(error);
      return;
    }

    // create user & hash the password
  }
}
