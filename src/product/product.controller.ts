import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';
import { CategoryResponse } from './interfaces/category.interface';

@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('categories')
  async getCategories(): Promise<CategoryResponse[]> {
    return this.productService.getAllCategories();
  }
}
