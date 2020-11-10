import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsBoolean, Length, IsOptional } from 'class-validator';

/**
 * entity for graphql and typeorm both.
 * so, it used in schema and database.
 */

@InputType({ isAbstract: true }) // for dto
@ObjectType() // for graphql
@Entity() // for typeorm
export class Restaurant {
  @Field(_ => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(_ => String) // for graphql
  @Column() // for typeorm
  @IsString() // for dto
  @Length(5) // for dto
  name: string;

  @Field(_ => Boolean, { nullable: true })
  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isVegan?: boolean;

  @Field(_ => String)
  @Column()
  @IsString()
  address: string;

  // @Field(_ => String)
  // @Column()
  // @IsString()
  // ownerName: string;

  // @Field(_ => String)
  // @Column()
  // @IsString()
  // categoryName: string;
}
