import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CategoryResponse } from './interfaces/category.interface';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async getAllCategories(): Promise<CategoryResponse[]> {
    try {
      const categories: CategoryResponse[] = await this.categoryModel
        .find({}, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
        .lean()
        .exec();

      return categories;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error fetching categories:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getCategoryNameMap(): Promise<
    Record<string, { categoryName: string; subCategoryName: string }>
  > {
    try {
      const categories = await this.categoryModel.find().lean().exec();
      const map: Record<string, any> = {};

      for (const cat of categories) {
        for (const sub of cat.subcategory) {
          const key = `${cat.categoryId}_${sub.subCategoryId}`;
          map[key] = {
            categoryName: cat.categoryName,
            subCategoryName: sub.subCategoryName,
          };
        }
      }
      return map;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in getCategoryNameMap:', error);
      throw new InternalServerErrorException(
        'Failed to load product master data',
      );
    }
  }
}
