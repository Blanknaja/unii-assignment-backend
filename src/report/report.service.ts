import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { ProductService } from 'src/product/product.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ORDER_TYPES } from 'src/order/constants';

@Injectable()
export class ReportService {
  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
  ) {}
  async getSummaryReport(filters: ReportFilterDto) {
    const categoryMap = await this.productService.getCategoryNameMap();

    this.validateFilters(filters, categoryMap);

    const { buyOrders, sellOrders } = await this.fetchRawData(filters);

    const mergedDataMap = this.mergeBuyAndSellData(buyOrders, sellOrders);

    return this.buildFinalResponse(mergedDataMap, categoryMap);
  }
  private validateFilters(
    filters: ReportFilterDto,
    categoryMap: Record<string, any>,
  ) {
    if (filters.startDate && filters.endDate) {
      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        throw new BadRequestException('Start date must be <= end date');
      }
    }

    const { categoryId, subCategoryId } = filters;
    const allKeys = Object.keys(categoryMap);

    const validCategories = new Set(allKeys.map((key) => key.split('_')[0]));
    const validSubCategories = new Set(allKeys.map((key) => key.split('_')[1]));

    if (categoryId && subCategoryId) {
      const isCatValid = validCategories.has(categoryId);
      const isSubValid = validSubCategories.has(subCategoryId);

      if (!isCatValid && !isSubValid) {
        throw new BadRequestException(
          `No category ${categoryId} and subCategory ${subCategoryId} found in system`,
        );
      }

      if (!isCatValid && isSubValid) {
        throw new BadRequestException(
          `No category ${categoryId} found in system`,
        );
      }

      if (isCatValid && !isSubValid) {
        throw new BadRequestException(
          `No subCategory ${subCategoryId} in category ${categoryId}`,
        );
      }

      const nameKey = `${categoryId}_${subCategoryId}`;
      if (!categoryMap[nameKey]) {
        throw new BadRequestException(
          `Subcategory ${subCategoryId} is not in category ${categoryId}`,
        );
      }
    } else if (categoryId) {
      if (!validCategories.has(categoryId)) {
        throw new BadRequestException(
          `No category ${categoryId} found in system`,
        );
      }
    } else if (subCategoryId) {
      if (!validSubCategories.has(subCategoryId)) {
        throw new BadRequestException(
          `No subCategory ${subCategoryId} found in system`,
        );
      }
    }
  }

  private async fetchRawData(filters: ReportFilterDto) {
    const [buyOrders, sellOrders] = await Promise.all([
      this.orderService.getAggregatedOrders(filters, ORDER_TYPES.BUY),
      this.orderService.getAggregatedOrders(filters, ORDER_TYPES.SELL),
    ]);

    return { buyOrders, sellOrders };
  }

  private mergeBuyAndSellData(buyOrders: any[], sellOrders: any[]) {
    console.log('mergeBuyAndSellData buyOrders', buyOrders);
    console.log('mergeBuyAndSellData sellOrders', sellOrders);

    const reportMap = new Map<string, any>();

    for (const buy of buyOrders) {
      const key = `${buy._id.categoryId}_${buy._id.subCategoryId}`;
      reportMap.set(key, {
        categoryId: buy._id.categoryId,
        subCategoryId: buy._id.subCategoryId,
        buy: this.formatTransactionData(buy),
        sell: this.getEmptyTransactionData(),
      });
    }

    for (const sell of sellOrders) {
      const key = `${sell._id.categoryId}_${sell._id.subCategoryId}`;
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          categoryId: sell._id.categoryId,
          subCategoryId: sell._id.subCategoryId,
          buy: this.getEmptyTransactionData(),
          sell: this.formatTransactionData(sell),
        });
      } else {
        reportMap.get(key).sell = this.formatTransactionData(sell);
      }
    }
    console.log('mergeBuyAndSellData reportMap: ', reportMap);
    return reportMap;
  }

  private buildFinalResponse(
    mergedDataMap: Map<string, any>,
    categoryMap: Record<string, any>,
  ) {
    const finalResult = Array.from(mergedDataMap.values()).map((row) => {
      const nameKey = `${row.categoryId}_${row.subCategoryId}`;
      const nameInfo = categoryMap[nameKey] || {
        categoryName: 'unknown',
        subCategoryName: 'unknown',
      };

      const balance = {
        qty: row.buy.totalQty - row.sell.totalQty,
        amount: row.buy.totalAmount - row.sell.totalAmount,
      };

      return { ...nameInfo, ...row, balance };
    });

    return finalResult.sort(
      (a, b) =>
        a.categoryId.localeCompare(b.categoryId) ||
        a.subCategoryId.localeCompare(b.subCategoryId),
    );
  }

  private formatTransactionData(data: any) {
    return {
      totalQty: data.totalQty || 0,
      totalAmount: data.totalAmount || 0,
      minPrice: data.prices.length > 0 ? Math.min(...data.prices) : 0,
      maxPrice: data.prices.length > 0 ? Math.max(...data.prices) : 0,

      orders: data.orders || [],

      grades: {
        A: data.gradeA,
        B: data.gradeB,
        C: data.gradeC,
        D: data.gradeD,
      },
    };
  }

  private getEmptyTransactionData() {
    return {
      totalQty: 0,
      totalAmount: 0,
      minPrice: 0,
      maxPrice: 0,
      orders: [],

      grades: { A: 0, B: 0, C: 0, D: 0 },
    };
  }
}
