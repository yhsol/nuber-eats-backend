import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

enum UserRole {
  Client,
  Owner,
  Delevery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class UserEntity extends CoreEntity {
  @Column()
  @Field(_ => String)
  email: string;

  @Column()
  @Field(_ => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(_ => UserRole)
  role: UserRole;
}
