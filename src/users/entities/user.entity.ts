import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entitites/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(_ => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(_ => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(_ => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(_ => Boolean)
  @IsBoolean()
  verified: boolean;

  @Field(_ => [Restaurant])
  @OneToMany(
    _ => Restaurant,
    restaurant => restaurant.owner,
  )
  restaurants: Restaurant[];

  @Field(_ => [Order])
  @OneToMany(
    _ => Order,
    order => order.customer,
  )
  orders: Order[];

  @Field(_ => [Order])
  @OneToMany(
    _ => Order,
    order => order.driver,
  )
  rides: Order[];

  @Field(_ => [Payment])
  @OneToMany(
    _ => Payment,
    payment => payment.user,
  )
  payments: Payment[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(plainPassword, this.password);
      return ok;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  }
}
