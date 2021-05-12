import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entitites/category.entity';

@ObjectType()
export class AllCategoriesOutput extends CoreOutput {
  @Field(_ => [Category], { nullable: true })
  results?: Category[];
}
