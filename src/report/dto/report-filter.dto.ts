import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { MatchType, GradeType } from '../constants';

export class ReportFilterDto {
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;

  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subCategoryId?: string;

  @IsOptional() @IsString() orderId?: string;
  @IsOptional() @IsEnum(MatchType) orderIdMatchType?: MatchType;

  @IsOptional() @IsNumber() minPrice?: number;
  @IsOptional() @IsNumber() maxPrice?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(GradeType, { each: true })
  grades?: GradeType[];
}
