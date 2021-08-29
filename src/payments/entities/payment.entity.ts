import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(_ => Int)
  @Column()
  transactionId: number;

  @Field(_ => User)
  @ManyToOne(
    _ => User,
    user => user.payments,
  )
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field(_ => Restaurant)
  @ManyToOne(_ => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
