import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  DashboardKPIsQueryDto,
  DashboardKPIsResponseDto,
  ContactInsightsQueryDto,
  ContactInsightsResponseDto,
  ActivityTimelineQueryDto,
  ActivityTimelineResponseDto,
  RevenueForecastQueryDto,
  RevenueForecastResponseDto,
  ChartDataQueryDto,
  ChartDataResponseDto,
} from './dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPIs', description: 'Returns key performance indicators for the analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard KPIs retrieved successfully', type: DashboardKPIsResponseDto })
  async getDashboardKPIs(
    @Request() req: any,
    @Query() query: DashboardKPIsQueryDto,
  ): Promise<DashboardKPIsResponseDto> {
    return this.analyticsService.getDashboardKPIs(req.user.id, query);
  }

  @Get('contacts/insights')
  @ApiOperation({ summary: 'Get contact insights', description: 'Returns engagement insights and analysis for contacts' })
  @ApiResponse({ status: 200, description: 'Contact insights retrieved successfully', type: ContactInsightsResponseDto })
  async getContactInsights(
    @Request() req: any,
    @Query() query: ContactInsightsQueryDto,
  ): Promise<ContactInsightsResponseDto> {
    return this.analyticsService.getContactInsights(req.user.id, query);
  }

  @Get('activity/timeline')
  @ApiOperation({ summary: 'Get activity timeline', description: 'Returns chronological list of activities with filtering' })
  @ApiResponse({ status: 200, description: 'Activity timeline retrieved successfully', type: ActivityTimelineResponseDto })
  async getActivityTimeline(
    @Request() req: any,
    @Query() query: ActivityTimelineQueryDto,
  ): Promise<ActivityTimelineResponseDto> {
    return this.analyticsService.getActivityTimeline(req.user.id, query);
  }

  @Get('revenue/forecast')
  @ApiOperation({ summary: 'Get revenue forecast', description: 'Returns revenue predictions and pipeline analysis' })
  @ApiResponse({ status: 200, description: 'Revenue forecast retrieved successfully', type: RevenueForecastResponseDto })
  async getRevenueForecast(
    @Request() req: any,
    @Query() query: RevenueForecastQueryDto,
  ): Promise<RevenueForecastResponseDto> {
    return this.analyticsService.getRevenueForecast(req.user.id, query);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get chart data', description: 'Returns data formatted for Chart.js visualization' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully', type: ChartDataResponseDto })
  async getChartData(
    @Request() req: any,
    @Query() query: ChartDataQueryDto,
  ): Promise<ChartDataResponseDto> {
    return this.analyticsService.getChartData(req.user.id, query);
  }
}
