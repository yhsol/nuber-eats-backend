import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entitites/restaurant.entity';

@InputType()
export class SearchRestaurantInput extends PaginationInput {
  @Field(_ => String)
  query: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field(_ => [Restaurant], { nullable: true })
  results?: Restaurant[];
}
