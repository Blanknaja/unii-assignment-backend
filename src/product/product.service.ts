import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async getAllCategories() {
    try {
      const categories = await this.categoryModel
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
}
