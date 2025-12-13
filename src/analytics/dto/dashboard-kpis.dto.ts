import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class DashboardKPIsQueryDto {
  @ApiPropertyOptional({ enum: TimePeriod, default: TimePeriod.MONTH })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.MONTH;

  @ApiPropertyOptional({ description: 'Start date for custom range (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom range (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class KPIChangeDto {
  @ApiProperty({ description: 'Current value' })
  current: number;

  @ApiProperty({ description: 'Previous period value' })
  previous: number;

  @ApiProperty({ description: 'Change percentage' })
  changePercent: number;

  @ApiProperty({ description: 'Trend direction', enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';
}

export class DashboardKPIsResponseDto {
  @ApiProperty({ description: 'Total contacts count and change' })
  totalContacts: KPIChangeDto;

  @ApiProperty({ description: 'Active contacts (had activity in period)' })
  activeContacts: KPIChangeDto;

  @ApiProperty({ description: 'New contacts added in period' })
  newContacts: KPIChangeDto;

  @ApiProperty({ description: 'Contacts synced from external sources' })
  syncedContacts: KPIChangeDto;

  @ApiProperty({ description: 'Average engagement score (0-100)' })
  avgEngagementScore: KPIChangeDto;

  @ApiProperty({ description: 'Total deals value in period' })
  totalDealsValue: KPIChangeDto;

  @ApiProperty({ description: 'Deals won in period' })
  dealsWon: KPIChangeDto;

  @ApiProperty({ description: 'Conversion rate (leads to closed)' })
  conversionRate: KPIChangeDto;

  @ApiProperty({ description: 'Total activities in period' })
  totalActivities: KPIChangeDto;

  @ApiProperty({ description: 'Sync success rate percentage' })
  syncSuccessRate: KPIChangeDto;

  @ApiProperty({ description: 'Period used for calculations' })
  period: TimePeriod;

  @ApiProperty({ description: 'Data fetched from cache' })
  cached: boolean;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: string;
}
