import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  STACKED_BAR = 'stacked_bar',
}

export enum ChartMetric {
  CONTACTS_GROWTH = 'contacts_growth',
  ENGAGEMENT_TREND = 'engagement_trend',
  ACTIVITY_BY_TYPE = 'activity_by_type',
  SYNC_SOURCES = 'sync_sources',
  DEALS_BY_STAGE = 'deals_by_stage',
  REVENUE_TREND = 'revenue_trend',
  CONVERSION_FUNNEL = 'conversion_funnel',
  CONTACTS_BY_COMPANY = 'contacts_by_company',
}

export class ChartDataQueryDto {
  @ApiProperty({ enum: ChartMetric, description: 'Metric to visualize' })
  @IsEnum(ChartMetric)
  metric: ChartMetric;

  @ApiPropertyOptional({ enum: ChartType, default: ChartType.LINE })
  @IsOptional()
  @IsEnum(ChartType)
  chartType?: ChartType = ChartType.LINE;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by interval', enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';

  @ApiPropertyOptional({ description: 'Number of data points', default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(365)
  dataPoints?: number = 12;
}

export class ChartDatasetDto {
  @ApiProperty({ description: 'Dataset label' })
  label: string;

  @ApiProperty({ description: 'Data values', type: [Number] })
  data: number[];

  @ApiProperty({ description: 'Background color(s)' })
  backgroundColor: string | string[];

  @ApiProperty({ description: 'Border color' })
  borderColor?: string;

  @ApiProperty({ description: 'Border width' })
  borderWidth?: number;

  @ApiProperty({ description: 'Fill area under line' })
  fill?: boolean;

  @ApiProperty({ description: 'Line tension (0-1)' })
  tension?: number;

  @ApiProperty({ description: 'Stack group ID for stacked charts' })
  stack?: string;
}

export class ChartOptionsDto {
  @ApiProperty({ description: 'Chart title' })
  title: string;

  @ApiProperty({ description: 'X-axis label' })
  xAxisLabel?: string;

  @ApiProperty({ description: 'Y-axis label' })
  yAxisLabel?: string;

  @ApiProperty({ description: 'Show legend' })
  showLegend: boolean;

  @ApiProperty({ description: 'Legend position' })
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';

  @ApiProperty({ description: 'Enable animations' })
  animated: boolean;

  @ApiProperty({ description: 'Responsive resize' })
  responsive: boolean;

  @ApiProperty({ description: 'Maintain aspect ratio' })
  maintainAspectRatio: boolean;

  @ApiProperty({ description: 'Custom tooltip format' })
  tooltipFormat?: string;
}

export class ChartDataResponseDto {
  @ApiProperty({ description: 'Chart type', enum: ChartType })
  type: ChartType;

  @ApiProperty({ description: 'Metric visualized', enum: ChartMetric })
  metric: ChartMetric;

  @ApiProperty({ description: 'Labels for data points (X-axis)', type: [String] })
  labels: string[];

  @ApiProperty({ description: 'Datasets', type: [ChartDatasetDto] })
  datasets: ChartDatasetDto[];

  @ApiProperty({ description: 'Chart options' })
  options: ChartOptionsDto;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  };

  @ApiProperty({ description: 'Data freshness' })
  dataFreshness: string;

  @ApiProperty({ description: 'Date range used' })
  dateRange: {
    start: string;
    end: string;
  };
}

// Index DTO for exporting all
export { DashboardKPIsQueryDto, DashboardKPIsResponseDto, TimePeriod, KPIChangeDto } from './dashboard-kpis.dto';
export { ContactInsightsQueryDto, ContactInsightsResponseDto, ContactInsightDto, InsightSortBy } from './contact-insights.dto';
export { ActivityTimelineQueryDto, ActivityTimelineResponseDto, ActivityItemDto, ActivityType } from './activity-timeline.dto';
export { RevenueForecastQueryDto, RevenueForecastResponseDto, ForecastModel, ForecastPeriod, PipelineStageDto } from './revenue-forecast.dto';
