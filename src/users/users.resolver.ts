import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(_ => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(_ => Boolean)
  hi() {
    return true;
  }

  @Mutation(_ => CreateAccountOutput)
  createAccount(@Args('input') createAccountInput: CreateAccountInput) {
    return true;
  }
}
