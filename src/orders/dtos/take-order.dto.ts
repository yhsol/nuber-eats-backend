import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class TakeOrderInput extends PickType(Order, ['id']) {
  @Field(_ => Boolean, { nullable: true })
  changeDriver?: boolean;
}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
