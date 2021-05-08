import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entitites/category.entity';

@ArgsType()
export class CategoryInput {
  @Field(_ => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends CoreOutput {
  @Field(_ => Category, { nullable: true })
  category?: Category;
}
