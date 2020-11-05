import { Resolver, Query } from "@nestjs/graphql";
import { Restaurant } from "./entitites/restaurant.entity";


@Resolver(() => Restaurant)
export class RestaurantResolver {
    @Query(() => Restaurant)
    myRestaurant() {
        return true
    }
}