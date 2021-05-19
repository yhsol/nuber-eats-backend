import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(_ => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(_ => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field(_ => String)
  @Column()
  @IsString()
  photo: string;

  @Field(_ => String, { nullable: true })
  @Column()
  @Length(5, 140)
  description: string;

  @Field(_ => Restaurant)
  @ManyToOne(
    _ => Restaurant,
    restaurant => restaurant.menu,
    { onDelete: 'CASCADE' },
  )
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;
}
