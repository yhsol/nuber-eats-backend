import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entitites/dish.entity';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    const restaurant = await this.restaurantRepository.findOne(restaurantId);

    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    items.forEach(async item => {
      const dish = await this.dishRepository.findOne(item.dishId);
      if (!dish) {
        // abort this whole thing
      }

      await this.orderItemRepository.save(
        this.orderItemRepository.create({
          dish,
          options: item.options,
        }),
      );
    });
    // const order = await this.orderRepository.save(
    //   this.orderRepository.create({
    //     customer,
    //     restaurant,
    //   }),
    // );

    // console.log('order: ', order);
  }
}
