import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { UserEntity } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(UserEntity, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput {
  @Field(_ => String, { nullable: true })
  error?: string;

  @Field(_ => Boolean)
  ok: boolean;
}
