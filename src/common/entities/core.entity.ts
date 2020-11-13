import { Field } from '@nestjs/graphql';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class CoreEntity {
  @PrimaryGeneratedColumn()
  @Field(_ => Number)
  id: number;

  @CreateDateColumn()
  @Field(_ => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(_ => Date)
  updatedAt: Date;
}
