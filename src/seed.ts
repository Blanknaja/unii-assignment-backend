import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { Order } from './order/schemas/order.schema';
// import { Category } from './product/schemas/category.schema';
import { ORDER_TYPES } from './order/constants';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orderModel = app.get<Model<Order>>(getModelToken(Order.name));
  // const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));

  try {
    // console.log('--- Start Import Master Data (Category) ---');
    // const productFilePath = path.join(process.cwd(), 'util', 'Products.json');
    // const productData = JSON.parse(fs.readFileSync(productFilePath, 'utf-8'));

    // await categoryModel.deleteMany({});
    // await categoryModel.insertMany(productData.productList);
    // console.log(
    //   `✅ Import Category success: ${productData.productList.length} categories`,
    // );

    console.log('\n--- Start Import Transaction (Order) ---');
    const orderFilePath = path.join(process.cwd(), 'util', 'Orders.json');
    const orderData = JSON.parse(fs.readFileSync(orderFilePath, 'utf-8'));

    const buyOrders = orderData.buyTransaction.map((order: any) => ({
      ...order,
      orderType: ORDER_TYPES.BUY,
    }));
    const sellOrders = orderData.sellTransaction
      ? orderData.sellTransaction.map((order: any) => ({
          ...order,
          orderType: ORDER_TYPES.SELL,
        }))
      : [];

    await orderModel.deleteMany({});
    await orderModel.insertMany([...buyOrders, ...sellOrders]);
    console.log(`✅ Import success`);
  } catch (error) {
    console.error('❌ Import Failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
