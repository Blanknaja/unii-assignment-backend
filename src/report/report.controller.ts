import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Controller('api/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('summary')
  @HttpCode(HttpStatus.OK)
  async getSummaryReport(@Body() filters: ReportFilterDto): Promise<any> {
    return await this.reportService.getSummaryReport(filters);
  }
}
