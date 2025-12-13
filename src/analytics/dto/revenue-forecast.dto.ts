import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum ForecastModel {
  LINEAR = 'linear',
  WEIGHTED_AVERAGE = 'weighted_average',
  EXPONENTIAL = 'exponential',
}

export enum ForecastPeriod {
  MONTH_1 = '1m',
  MONTH_3 = '3m',
  MONTH_6 = '6m',
  YEAR_1 = '1y',
}

export class RevenueForecastQueryDto {
  @ApiPropertyOptional({ enum: ForecastModel, default: ForecastModel.WEIGHTED_AVERAGE })
  @IsOptional()
  @IsEnum(ForecastModel)
  model?: ForecastModel = ForecastModel.WEIGHTED_AVERAGE;

  @ApiPropertyOptional({ enum: ForecastPeriod, default: ForecastPeriod.MONTH_3 })
  @IsOptional()
  @IsEnum(ForecastPeriod)
  forecastPeriod?: ForecastPeriod = ForecastPeriod.MONTH_3;

  @ApiPropertyOptional({ description: 'Confidence level (0-100)', default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(99)
  confidenceLevel?: number = 80;
}

export class ForecastDataPointDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Month label' })
  month: string;

  @ApiProperty({ description: 'Predicted revenue value' })
  predicted: number;

  @ApiProperty({ description: 'Lower bound (confidence interval)' })
  lowerBound: number;

  @ApiProperty({ description: 'Upper bound (confidence interval)' })
  upperBound: number;

  @ApiProperty({ description: 'Is this a forecast or actual data' })
  isForecast: boolean;

  @ApiProperty({ description: 'Actual value (only for historical data)' })
  actual?: number;
}

export class PipelineStageDto {
  @ApiProperty({ description: 'Stage name' })
  stage: string;

  @ApiProperty({ description: 'Stage display label' })
  label: string;

  @ApiProperty({ description: 'Deals count in this stage' })
  count: number;

  @ApiProperty({ description: 'Total value in this stage' })
  value: number;

  @ApiProperty({ description: 'Average probability to close' })
  avgProbability: number;

  @ApiProperty({ description: 'Weighted value (value * probability)' })
  weightedValue: number;

  @ApiProperty({ description: 'Stage color for UI' })
  color: string;
}

export class RevenueSummaryDto {
  @ApiProperty({ description: 'Current month revenue' })
  currentMonth: number;

  @ApiProperty({ description: 'Previous month revenue' })
  previousMonth: number;

  @ApiProperty({ description: 'Month-over-month change percent' })
  momChange: number;

  @ApiProperty({ description: 'Year-to-date revenue' })
  ytd: number;

  @ApiProperty({ description: 'Previous year same period' })
  previousYtd: number;

  @ApiProperty({ description: 'Year-over-year change percent' })
  yoyChange: number;

  @ApiProperty({ description: 'Average deal size' })
  avgDealSize: number;

  @ApiProperty({ description: 'Win rate percentage' })
  winRate: number;

  @ApiProperty({ description: 'Average sales cycle (days)' })
  avgSalesCycle: number;
}

export class RevenueForecastResponseDto {
  @ApiProperty({ description: 'Forecast data points', type: [ForecastDataPointDto] })
  forecast: ForecastDataPointDto[];

  @ApiProperty({ description: 'Historical data points', type: [ForecastDataPointDto] })
  historical: ForecastDataPointDto[];

  @ApiProperty({ description: 'Pipeline breakdown by stage', type: [PipelineStageDto] })
  pipeline: PipelineStageDto[];

  @ApiProperty({ description: 'Revenue summary' })
  summary: RevenueSummaryDto;

  @ApiProperty({ description: 'Total forecasted revenue' })
  totalForecast: number;

  @ApiProperty({ description: 'Forecasted growth rate' })
  forecastGrowthRate: number;

  @ApiProperty({ description: 'Confidence level used' })
  confidenceLevel: number;

  @ApiProperty({ description: 'Model used for forecast' })
  model: ForecastModel;

  @ApiProperty({ description: 'Forecast period' })
  period: ForecastPeriod;

  @ApiProperty({ description: 'Forecast generated at' })
  generatedAt: string;
}
