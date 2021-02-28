import { InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entitites/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends OmitType(Restaurant, [
  'id',
  'category',
  'owner',
]) {}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
