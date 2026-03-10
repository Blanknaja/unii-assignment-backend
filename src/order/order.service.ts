import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { ReportFilterDto } from '../report/dto/report-filter.dto';
import { MatchType } from '../report/constants';
import { OrderType } from './constants';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async getAggregatedOrders(filters: ReportFilterDto, orderType: OrderType) {
    try {
      const pipeline = this.buildAggregationPipeline(filters, orderType);
      return await this.orderModel.aggregate(pipeline);
    } catch (error) {
      console.error(`Error aggregating orders for ${orderType}:`, error);
      throw new InternalServerErrorException(
        `Error aggregating orders for ${orderType}`,
      );
    }
  }

  private buildAggregationPipeline(
    filters: ReportFilterDto,
    orderType: OrderType,
  ): any[] {
    const headerMatch = this.buildHeaderMatch(filters, orderType);
    const itemMatch = this.buildItemMatch(filters);

    return [
      { $match: headerMatch },

      { $unwind: '$requestList' },
      { $addFields: { itemSub: '$requestList' } },
      { $unwind: '$itemSub.requestList' },

      {
        $addFields: {
          itemGrade: {
            grade: '$itemSub.requestList.grade',
            price: { $toDouble: '$itemSub.requestList.price' },
            quantity: { $toDouble: '$itemSub.requestList.quantity' },
            // total: { $toDouble: '$itemSub.requestList.total' },
            total: {
              $multiply: [
                { $toDouble: '$itemSub.requestList.price' },
                { $toDouble: '$itemSub.requestList.quantity' },
              ],
            },
          },
        },
      },

      { $match: itemMatch },

      {
        $group: {
          _id: {
            categoryId: '$itemSub.categoryID',
            subCategoryId: '$itemSub.subCategoryID',
          },
          // orderIds: { $addToSet: '$orderId' },
          orders: {
            $push: {
              orderId: '$orderId',
              date: '$orderFinishedDate',
              quantity: '$itemGrade.quantity',
              grade: '$itemGrade.grade',
              price: '$itemGrade.price',
            },
          },
          totalQty: { $sum: '$itemGrade.quantity' },
          totalAmount: { $sum: '$itemGrade.total' },
          prices: { $push: '$itemGrade.price' },
          gradeA: {
            $sum: {
              $cond: [
                { $eq: ['$itemGrade.grade', 'A'] },
                '$itemGrade.quantity',
                0,
              ],
            },
          },
          gradeB: {
            $sum: {
              $cond: [
                { $eq: ['$itemGrade.grade', 'B'] },
                '$itemGrade.quantity',
                0,
              ],
            },
          },
          gradeC: {
            $sum: {
              $cond: [
                { $eq: ['$itemGrade.grade', 'C'] },
                '$itemGrade.quantity',
                0,
              ],
            },
          },
          gradeD: {
            $sum: {
              $cond: [
                { $eq: ['$itemGrade.grade', 'D'] },
                '$itemGrade.quantity',
                0,
              ],
            },
          },
        },
      },
    ];
  }

  private buildHeaderMatch(filters: ReportFilterDto, orderType: OrderType) {
    const match: any = { orderType };

    if (filters.startDate || filters.endDate) {
      match.orderFinishedDate = {};
      if (filters.startDate) match.orderFinishedDate.$gte = filters.startDate;
      if (filters.endDate) match.orderFinishedDate.$lte = filters.endDate;
    }

    if (filters.orderId) {
      match.orderId =
        filters.orderIdMatchType === MatchType.EXACT
          ? filters.orderId
          : { $regex: filters.orderId, $options: 'i' };
    }
    return match;
  }

  private buildItemMatch(filters: ReportFilterDto) {
    const match: any = { 'itemGrade.quantity': { $gt: 0 } };

    if (filters.subCategoryId) {
      match['itemSub.subCategoryID'] = filters.subCategoryId;
    } else if (filters.categoryId) {
      match['itemSub.categoryID'] = filters.categoryId;
    }

    if (filters.grades?.length)
      match['itemGrade.grade'] = { $in: filters.grades };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      match['itemGrade.price'] = {};
      if (filters.minPrice !== undefined)
        match['itemGrade.price'].$gte = Number(filters.minPrice);
      if (filters.maxPrice !== undefined)
        match['itemGrade.price'].$lte = Number(filters.maxPrice);
    }
    return match;
  }
}
