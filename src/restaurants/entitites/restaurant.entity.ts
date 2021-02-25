import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

/**
 * entity for graphql and typeorm both.
 * so, it used in schema and database.
 */

@InputType('RestaruantInputType', { isAbstract: true }) // for dto
@ObjectType() // for graphql
@Entity() // for typeorm
export class Restaurant extends CoreEntity {
  @Field(_ => String) // for graphql
  @Column() // for typeorm
  @IsString() // for dto
  @Length(5) // for dto
  name: string;

  @Field(_ => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(_ => String, { defaultValue: '강남' })
  @Column()
  @IsString()
  address: string;

  @Field(_ => Category, { nullable: true })
  @ManyToOne(
    _ => Category,
    category => category.restaurants,
    { nullable: true, onDelete: 'SET NULL' },
  )
  category: Category;

  @Field(_ => User)
  @ManyToMany(
    _ => User,
    user => user.restaurants,
  )
  owner: User;
}
