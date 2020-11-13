import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

type UserRole = 'client' | 'owner' | 'delevery';

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

  @Column()
  @Field(_ => String)
  role: UserRole;
}
