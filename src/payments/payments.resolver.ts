import { Mutation, Resolver } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payments.service';

@Resolver(_ => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}
}
