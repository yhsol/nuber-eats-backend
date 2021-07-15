import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entitites/dish.entity';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
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
    try {
      const restaurant = await this.restaurantRepository.findOne(restaurantId);

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const dish = await this.dishRepository.findOne(item.dishId);
        if (!dish) {
          return { ok: false, error: 'Dish not found.' };
        }

        let dishFinalPrice = dish.price;

        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            dishOption => dishOption.name === itemOption.name,
          );
          // dishOption 의 extra
          if (dishOption?.extra) {
            dishFinalPrice += dishOption.extra;
          }

          const dishOptionChoice = dishOption.choices.find(optionChoice => {
            return optionChoice.name === itemOption.choice;
          });
          // dishOption 의 choices 의 extra
          if (dishOptionChoice?.extra) {
            dishFinalPrice += dishOptionChoice.extra;
          }
        }

        orderFinalPrice += dishFinalPrice;

        const orderItem = await this.orderItemRepository.save(
          this.orderItemRepository.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      await this.orderRepository.save(
        this.orderRepository.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create order',
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orderRepository.find({
          where: {
            customer: user,
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orderRepository.find({
          where: {
            driver: user,
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurantRepository.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        orders = restaurants.map(restaurant => restaurant.orders).flat(1);
      }

      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Couldn't get orders",
      };
    }
  }
}
