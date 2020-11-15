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
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const error = await this.usersService.createAccount(createAccountInput);
      if (error) {
        return {
          ok: false,
          error,
        };
      }

      return {
        ok: true,
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
