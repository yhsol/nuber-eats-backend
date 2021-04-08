import { EntityRepository, Repository } from 'typeorm';
import { Category } from '../entitites/category.entity';

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  async getCreated(name: string) {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    let category = await this.findOne({ slug: categorySlug });
    if (!category) {
      category = await this.save(
        this.create({ name: categoryName, slug: categorySlug }),
      );
    }

    return category;
  }
}
