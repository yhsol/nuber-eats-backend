import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(_ => String)
  @Column({ unique: true })
  @IsString()
  @Length(5)
  name: string;

  @Field(_ => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImg: string;

  @Field(_ => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  @Field(_ => [Restaurant], { nullable: true })
  @OneToMany(
    _ => Restaurant,
    restaurant => restaurant.category,
  )
  restaurants: Restaurant[];
}
