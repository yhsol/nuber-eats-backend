import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOne(
        createPaymentInput.restaurantId,
      );

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not allowed to do this',
        };
      }

      await this.paymentRepository.save(
        this.paymentRepository.create({
          transactionId: createPaymentInput.transactionId,
          user: owner,
          restaurant,
        }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.paymentRepository.find({ user });

      return {
        ok: true,
        payments,
      };
    } catch (error) {
      return { ok: false, error: 'Could not get payments' };
    }
  }
}
