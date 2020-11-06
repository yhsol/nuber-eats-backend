import { Resolver, Query, Args } from "@nestjs/graphql";
import { Restaurant } from "./entitites/restaurant.entity";


@Resolver(_ => Restaurant)
export class RestaurantResolver {
    @Query(_ => [Restaurant])
    restaurants(@Args("veganOnly") veganOnly: boolean): Restaurant[] {
        console.log(veganOnly)
        return []
    }
}
