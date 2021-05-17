import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entitites/restaurant.entity';

@InputType()
export class RestaurantInput {
  @Field(_ => Int)
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
  @Field(_ => Restaurant, { nullable: true })
  results?: Restaurant;
}
