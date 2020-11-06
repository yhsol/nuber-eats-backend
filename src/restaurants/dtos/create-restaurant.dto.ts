import { Field, ArgsType } from '@nestjs/graphql';

@ArgsType()
export class CreateRestaurantDto {
  @Field(_ => String)
  name: string;

  @Field(_ => Boolean)
  isVegan: boolean;

  @Field(_ => String)
  address: string;

  @Field(_ => String)
  ownerName: string;
}
