import { Query, Resolver } from '@nestjs/graphql';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(_ => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(_ => Boolean)
  hi() {
    return true;
  }
}
