import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export enum ActivityType {
  ALL = 'all',
  EMAIL = 'email',
  CALL = 'call',
  MEETING = 'meeting',
  NOTE = 'note',
  TASK = 'task',
  DEAL_UPDATE = 'deal_update',
  CONTACT_CREATED = 'contact_created',
  CONTACT_SYNCED = 'contact_synced',
}

export class ActivityTimelineQueryDto {
  @ApiPropertyOptional({ enum: ActivityType, default: ActivityType.ALL })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType = ActivityType.ALL;

  @ApiPropertyOptional({ description: 'Contact ID to filter by' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Number of results', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class ActivityItemDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type', enum: ActivityType })
  type: ActivityType;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Related contact ID' })
  contactId: string | null;

  @ApiProperty({ description: 'Related contact name' })
  contactName: string | null;

  @ApiProperty({ description: 'Related deal ID' })
  dealId: string | null;

  @ApiProperty({ description: 'Related deal name' })
  dealName: string | null;

  @ApiProperty({ description: 'Activity metadata' })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Engagement score contribution' })
  engagementScore: number;

  @ApiProperty({ description: 'When activity occurred' })
  occurredAt: string;

  @ApiProperty({ description: 'Human-readable time ago' })
  timeAgo: string;

  @ApiProperty({ description: 'Icon name for UI' })
  icon: string;

  @ApiProperty({ description: 'Color code for UI' })
  color: string;
}

export class DailyActivitySummaryDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Total activities count' })
  total: number;

  @ApiProperty({ description: 'Breakdown by type' })
  byType: Record<string, number>;
}

export class ActivityTimelineResponseDto {
  @ApiProperty({ description: 'Activity items', type: [ActivityItemDto] })
  activities: ActivityItemDto[];

  @ApiProperty({ description: 'Daily activity summary', type: [DailyActivitySummaryDto] })
  dailySummary: DailyActivitySummaryDto[];

  @ApiProperty({ description: 'Total activities count (all matching filters)' })
  totalCount: number;

  @ApiProperty({ description: 'Has more results' })
  hasMore: boolean;

  @ApiProperty({ description: 'Activity type breakdown' })
  typeBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Most active contacts in period' })
  mostActiveContacts: Array<{ contactId: string; contactName: string; count: number }>;
}
