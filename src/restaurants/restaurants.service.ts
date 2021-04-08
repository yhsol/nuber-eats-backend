import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileInput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Category } from './entitites/category.entity';
import { Restaurant } from './entitites/restaurant.entity';

type CreateOrEditCategory = {
  craeteOrEditCategoryInput: CreateRestaurantInput | EditRestaurantInput;
  restaurant: Restaurant;
};

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async createOrEditCategory(name: string) {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    let category = await this.categories.findOne({ slug: categorySlug });
    if (!category) {
      category = await this.categories.save(
        this.categories.create({ name: categoryName, slug: categorySlug }),
      );
    }

    return category;
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurantsRepository.create(
        createRestaurantInput,
      );
      newRestaurant.owner = owner;

      const category = await this.createOrEditCategory(
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

      if (restaurant.category) {
        const category = await this.createOrEditCategory(
          editRestaurantInput.categoryName,
        );
        restaurant.category = category;
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit restaurant',
      };
    }

    return { ok: true };
  }
}
