import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ProductModule } from 'src/product/product.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  controllers: [ReportController],
  providers: [ReportService],
  imports: [ProductModule, OrderModule],
})
export class ReportModule {}
