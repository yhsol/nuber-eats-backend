import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { ORDER_SUBSCRIPTION, PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/order-update.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

@Resolver(_ => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  @Mutation(_ => CreateOrderOutput)
  @Role(['Client'])
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(customer, createOrderInput);
  }

  @Query(_ => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.orderService.getOrders(user, getOrdersInput);
  }

  @Query(_ => GetOrderOutput)
  @Role(['Any'])
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.orderService.getOrder(user, getOrderInput);
  }

  @Mutation(_ => EditOrderOutput)
  @Role(['Any'])
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.orderService.editOrder(user, editOrderInput);
  }

  @Subscription(_ => Order, {
    filter: (payload, _, context) => {
      return (
        payload[ORDER_SUBSCRIPTION.method.pendingOrders]?.ownerId ===
        context?.user?.id
      );
    },
    resolve: payload => payload[ORDER_SUBSCRIPTION.method.pendingOrders].order,
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubsub.asyncIterator(
      ORDER_SUBSCRIPTION.trigger.NEW_PENDING_ORDER,
    );
  }

  @Subscription(_ => Order)
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubsub.asyncIterator(
      ORDER_SUBSCRIPTION.trigger.NEW_COOKED_ORDER,
    );
  }

  @Subscription(_ => Order)
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubsub.asyncIterator(
      ORDER_SUBSCRIPTION.trigger.NEW_ORDER_UPDATE,
    );
  }
}
