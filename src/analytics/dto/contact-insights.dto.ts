import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum InsightSortBy {
  ENGAGEMENT = 'engagement',
  RECENT_ACTIVITY = 'recentActivity',
  DEAL_VALUE = 'dealValue',
  SYNC_STATUS = 'syncStatus',
}

export class ContactInsightsQueryDto {
  @ApiPropertyOptional({ description: 'Minimum engagement score filter (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minEngagement?: number;

  @ApiPropertyOptional({ description: 'Maximum engagement score filter (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxEngagement?: number;

  @ApiPropertyOptional({ enum: InsightSortBy, default: InsightSortBy.ENGAGEMENT })
  @IsOptional()
  @IsEnum(InsightSortBy)
  sortBy?: InsightSortBy = InsightSortBy.ENGAGEMENT;

  @ApiPropertyOptional({ description: 'Number of results', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class ContactInsightDto {
  @ApiProperty({ description: 'Contact ID' })
  id: string;

  @ApiProperty({ description: 'Contact full name' })
  fullName: string;

  @ApiProperty({ description: 'Contact email' })
  email: string | null;

  @ApiProperty({ description: 'Contact phone' })
  phone: string | null;

  @ApiProperty({ description: 'Company name' })
  company: string | null;

  @ApiProperty({ description: 'Engagement score (0-100)' })
  engagementScore: number;

  @ApiProperty({ description: 'Engagement level', enum: ['cold', 'warm', 'hot', 'champion'] })
  engagementLevel: 'cold' | 'warm' | 'hot' | 'champion';

  @ApiProperty({ description: 'Total activities count' })
  totalActivities: number;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityAt: string | null;

  @ApiProperty({ description: 'Days since last activity' })
  daysSinceActivity: number | null;

  @ApiProperty({ description: 'Open deals count' })
  openDeals: number;

  @ApiProperty({ description: 'Total deals value' })
  totalDealsValue: number;

  @ApiProperty({ description: 'Sync sources', example: ['apple', 'google'] })
  syncSources: string[];

  @ApiProperty({ description: 'Recommended next action' })
  recommendedAction: string;
}

export class EngagementDistributionDto {
  @ApiProperty({ description: 'Cold contacts (0-25 score)' })
  cold: number;

  @ApiProperty({ description: 'Warm contacts (26-50 score)' })
  warm: number;

  @ApiProperty({ description: 'Hot contacts (51-75 score)' })
  hot: number;

  @ApiProperty({ description: 'Champion contacts (76-100 score)' })
  champion: number;
}

export class ContactInsightsResponseDto {
  @ApiProperty({ description: 'Top contacts by selected criteria', type: [ContactInsightDto] })
  topContacts: ContactInsightDto[];

  @ApiProperty({ description: 'Contacts at risk (no activity 30+ days)', type: [ContactInsightDto] })
  atRiskContacts: ContactInsightDto[];

  @ApiProperty({ description: 'Engagement score distribution' })
  engagementDistribution: EngagementDistributionDto;

  @ApiProperty({ description: 'Average engagement score' })
  avgEngagement: number;

  @ApiProperty({ description: 'Total contacts analyzed' })
  totalAnalyzed: number;

  @ApiProperty({ description: 'Sort criteria used' })
  sortedBy: InsightSortBy;
}
