import {
  Field,
  InputType,
  Float,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entitites/dish.entity';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(_ => User, { nullable: true })
  @ManyToOne(
    _ => User,
    user => user.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  customer?: User;

  @Field(_ => User, { nullable: true })
  @ManyToOne(
    _ => User,
    user => user.rides,
    { onDelete: 'SET NULL', nullable: true },
  )
  driver?: User;

  @Field(_ => Restaurant)
  @ManyToOne(
    _ => Restaurant,
    restaurant => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  restaurant?: Restaurant;

  @Field(_ => [Dish])
  @ManyToMany(_ => Dish)
  @JoinTable()
  dishes: Dish[];

  @Column()
  @Field(_ => Float)
  total: number;

  @Column({ type: 'enum', enum: OrderStatus })
  @Field(_ => OrderStatus)
  status: OrderStatus;
}
