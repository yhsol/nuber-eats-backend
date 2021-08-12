import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { ORDER_SUBSCRIPTION, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entitites/dish.entity';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

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
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
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

      const order = await this.orderRepository.save(
        this.orderRepository.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      await this.pubsub.publish(ORDER_SUBSCRIPTION.trigger.NEW_PENDING_ORDER, {
        [ORDER_SUBSCRIPTION.method.pendingOrders]: order,
      });

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
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orderRepository.find({
          where: {
            driver: user,
            ...(status && { status }),
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
        if (status) {
          orders = orders.filter(order => order.status === status);
        }
      }

      console.log('orders: ', orders);

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

  isAllowed(user: User, order: Order): boolean {
    let allowed = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      allowed = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      allowed = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      allowed = false;
    }
    return allowed;
  }

  async getOrder(user: User, { id }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orderRepository.findOne(id, {
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }

      if (!this.isAllowed(user, order)) {
        return {
          ok: false,
          error: "You can't see that",
        };
      }

      return { ok: true, order };
    } catch (error) {
      console.error(error);

      return {
        ok: false,
        error: 'Could not get order',
      };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status: orderStatus }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orderRepository.findOne(orderId, {
        relations: ['restaurant'],
      });

      if (!order) {
        return {
          ok: false,
          error: 'Order Not Found',
        };
      }

      if (!this.isAllowed(user, order)) {
        return {
          ok: false,
          error: "You can't do that",
        };
      }

      let canEditStatus = true;

      if (user.role === UserRole.Client) {
        canEditStatus = false;
      }
      if (user.role === UserRole.Owner) {
        if (
          orderStatus !== OrderStatus.Cooking &&
          orderStatus !== OrderStatus.Cooked
        ) {
          canEditStatus = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          orderStatus !== OrderStatus.PickedUp &&
          orderStatus !== OrderStatus.Delivered
        ) {
          canEditStatus = false;
        }
      }

      if (!canEditStatus) {
        return {
          ok: false,
          error: "You can't do that",
        };
      }

      await this.orderRepository.save([
        {
          id: orderId,
          status: orderStatus,
        },
      ]);

      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);

      return {
        ok: false,
        error: 'Could not edit order',
      };
    }
  }
}
