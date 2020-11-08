import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * entity for graphql and typeorm both.
 * so, it used in schema and database.
 */
@ObjectType() // for graphql
@Entity() // for typeorm
export class Restaurant {
  @Field(_ => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(_ => String) // for graphql
  @Column() // for typeorm
  name: string;

  @Field(_ => Boolean)
  @Column()
  isVegan?: boolean;

  @Field(_ => String)
  @Column()
  address: string;

  @Field(_ => String)
  @Column()
  ownerName: string;

  @Field(_ => String)
  @Column()
  categoryName: string;
}
