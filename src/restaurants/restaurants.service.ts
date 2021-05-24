import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileInput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Like, Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/craete-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entitites/category.entity';
import { Restaurant } from './entitites/restaurant.entity';
import { CategoryRepository } from './repository/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurantsRepository.create(
        createRestaurantInput,
      );
      newRestaurant.owner = owner;

      const category = await this.categories.getCreated(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;

      // categoryId 가 db 에 들어가지 않던 문제 해결
      // await this.restaurantsRepository.save(newRestaurant); 를 newRestaurant.category = category; 전에 함.
      // 아래로 내리자 잘 들어감.
      await this.restaurantsRepository.save(newRestaurant);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne(
        editRestaurantInput.restaurantId,
      );
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit a Restaurant you don't own",
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getCreated(
          editRestaurantInput.categoryName,
        );
        restaurant.category = category;
      }

      await this.restaurantsRepository.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne(
        deleteRestaurantInput.restaurantId,
      );

      if (!restaurant) return { ok: false, error: 'Restaurant Not Found' };
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a Restaurant you don't own",
        };
      }

      await this.restaurantsRepository.delete(restaurant);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();

      return {
        ok: true,
        results: categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  countRestaurant(category: Category) {
    return this.restaurantsRepository.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });

      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }

      // restaurants by page
      const restaurants = await this.restaurantsRepository.find({
        where: {
          category,
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      // category.restaurants = restaurants; // restaurant 를 따로 Field 를 만들어서 내보내는 것으로 수정

      // total pages
      const totalCategories = await this.countRestaurant(category);
      const totalPages = Math.ceil(totalCategories / 25);

      return {
        ok: true,
        results: category,
        totalPages,
        restaurants,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load category',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [
        restaurants,
        totalResults,
      ] = await this.restaurantsRepository.findAndCount({
        skip: (page - 1) * 25,
        take: 25,
      });

      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Couldn't find Restaurants",
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOne(
        restaurantId,
        {
          relations: ['menu'],
        },
      );

      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      return {
        ok: true,
        results: restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Couldn't find Restaurant",
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [
        restaurant,
        totalResults,
      ] = await this.restaurantsRepository.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * 25,
        take: 25,
      });
      return {
        ok: true,
        results: restaurant,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return {
        ok: false,
        error: `Couldn't find Restaurants By ${query}`,
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return {
      ok: false,
    };
  }
}
