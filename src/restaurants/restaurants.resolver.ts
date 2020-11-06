import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entitites/restaurant.entity';

@Resolver(_ => Restaurant)
export class RestaurantResolver {
  @Query(_ => [Restaurant])
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    console.log(veganOnly);
    return [];
  }

  @Mutation(_ => Boolean)
  createRestaurant(@Args() createRestaurantDto: CreateRestaurantDto): boolean {
    console.log('createRestaurantDto: ', createRestaurantDto);
    return true;
  }
}
