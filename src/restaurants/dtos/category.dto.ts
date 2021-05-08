import { InputType, Field, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Category } from '../entitites/category.entity';

@InputType()
export class CategoryInput extends PaginationInput {
  @Field(_ => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(_ => Category, { nullable: true })
  category?: Category;
}
