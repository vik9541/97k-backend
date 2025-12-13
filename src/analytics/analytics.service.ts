import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  DashboardKPIsQueryDto,
  DashboardKPIsResponseDto,
  TimePeriod,
  KPIChangeDto,
  ContactInsightsQueryDto,
  ContactInsightsResponseDto,
  ContactInsightDto,
  InsightSortBy,
  ActivityTimelineQueryDto,
  ActivityTimelineResponseDto,
  ActivityItemDto,
  ActivityType,
  RevenueForecastQueryDto,
  RevenueForecastResponseDto,
  ForecastModel,
  ForecastPeriod,
  ForecastDataPointDto,
  PipelineStageDto,
  ChartDataQueryDto,
  ChartDataResponseDto,
  ChartType,
  ChartMetric,
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly CACHE_TTL_MINUTES = 5;

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // DASHBOARD KPIs
  // ============================================

  async getDashboardKPIs(userId: string, query: DashboardKPIsQueryDto): Promise<DashboardKPIsResponseDto> {
    const cacheKey = `dashboard_kpis_${userId}_${query.period}`;
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const { startDate, endDate, prevStartDate, prevEndDate } = this.getDateRange(query.period, query.startDate, query.endDate);

    // Parallel queries for current and previous periods
    const [
      totalContacts,
      prevTotalContacts,
      newContacts,
      prevNewContacts,
      syncedContacts,
      prevSyncedContacts,
      totalActivities,
      prevTotalActivities,
      dealsWon,
      prevDealsWon,
      totalDealsValue,
      prevTotalDealsValue,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { userId } }),
      this.prisma.contact.count({ where: { userId, createdAt: { lt: startDate } } }),
      this.prisma.contact.count({ where: { userId, createdAt: { gte: startDate, lte: endDate } } }),
      this.prisma.contact.count({ where: { userId, createdAt: { gte: prevStartDate, lte: prevEndDate } } }),
      this.prisma.contact.count({ where: { userId, sourceType: { not: 'manual' } } }),
      this.prisma.contact.count({ where: { userId, sourceType: { not: 'manual' }, createdAt: { lt: startDate } } }),
      this.prisma.contactActivity.count({ where: { userId, occurredAt: { gte: startDate, lte: endDate } } }),
      this.prisma.contactActivity.count({ where: { userId, occurredAt: { gte: prevStartDate, lte: prevEndDate } } }),
      this.prisma.deal.count({ where: { userId, stage: 'closed_won', closedAt: { gte: startDate, lte: endDate } } }),
      this.prisma.deal.count({ where: { userId, stage: 'closed_won', closedAt: { gte: prevStartDate, lte: prevEndDate } } }),
      this.prisma.deal.aggregate({ where: { userId, stage: 'closed_won', closedAt: { gte: startDate, lte: endDate } }, _sum: { value: true } }),
      this.prisma.deal.aggregate({ where: { userId, stage: 'closed_won', closedAt: { gte: prevStartDate, lte: prevEndDate } }, _sum: { value: true } }),
    ]);

    // Calculate active contacts (had activity in period)
    const activeContactsData = await this.prisma.contactActivity.groupBy({
      by: ['contactId'],
      where: { userId, occurredAt: { gte: startDate, lte: endDate } },
    });
    const activeContacts = activeContactsData.length;

    const prevActiveContactsData = await this.prisma.contactActivity.groupBy({
      by: ['contactId'],
      where: { userId, occurredAt: { gte: prevStartDate, lte: prevEndDate } },
    });
    const prevActiveContacts = prevActiveContactsData.length;

    // Engagement score average
    const engagementData = await this.prisma.contactActivity.aggregate({
      where: { userId },
      _avg: { engagementScore: true },
    });
    const avgEngagement = engagementData._avg.engagementScore || 0;

    const result: DashboardKPIsResponseDto = {
      totalContacts: this.createKPIChange(totalContacts, prevTotalContacts),
      activeContacts: this.createKPIChange(activeContacts, prevActiveContacts),
      newContacts: this.createKPIChange(newContacts, prevNewContacts),
      syncedContacts: this.createKPIChange(syncedContacts, prevSyncedContacts),
      avgEngagementScore: this.createKPIChange(Math.round(avgEngagement), Math.round(avgEngagement * 0.95)),
      totalDealsValue: this.createKPIChange(
        Number(totalDealsValue._sum.value || 0),
        Number(prevTotalDealsValue._sum.value || 0)
      ),
      dealsWon: this.createKPIChange(dealsWon, prevDealsWon),
      conversionRate: this.createKPIChange(await this.calculateConversionRate(userId), 0),
      totalActivities: this.createKPIChange(totalActivities, prevTotalActivities),
      syncSuccessRate: this.createKPIChange(98, 97), // Placeholder - calculate from sync logs
      period: query.period || TimePeriod.MONTH,
      cached: false,
      updatedAt: new Date().toISOString(),
    };

    await this.saveToCache(cacheKey, result);
    return result;
  }

  // ============================================
  // CONTACT INSIGHTS
  // ============================================

  async getContactInsights(userId: string, query: ContactInsightsQueryDto): Promise<ContactInsightsResponseDto> {
    const { minEngagement = 0, maxEngagement = 100, sortBy = InsightSortBy.ENGAGEMENT, limit = 10 } = query;

    // Get contacts with activity aggregation
    const contacts = await this.prisma.contact.findMany({
      where: { userId },
      include: {
        _count: { select: { activities: true, deals: true } },
      },
    });

    // Calculate engagement scores and transform
    const contactInsights: ContactInsightDto[] = await Promise.all(
      contacts.map(async (contact) => {
        const activities = await this.prisma.contactActivity.findMany({
          where: { contactId: contact.id },
          orderBy: { occurredAt: 'desc' },
          take: 1,
        });

        const totalDealsValue = await this.prisma.deal.aggregate({
          where: { contactId: contact.id },
          _sum: { value: true },
        });

        const engagementScore = await this.calculateEngagementScore(contact.id);
        const lastActivity = activities[0];
        const daysSinceActivity = lastActivity 
          ? Math.floor((Date.now() - lastActivity.occurredAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: contact.id.toString(),
          fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          engagementScore,
          engagementLevel: this.getEngagementLevel(engagementScore),
          totalActivities: contact._count.activities,
          lastActivityAt: lastActivity?.occurredAt.toISOString() || null,
          daysSinceActivity,
          openDeals: contact._count.deals,
          totalDealsValue: Number(totalDealsValue._sum.value || 0),
          syncSources: this.getSyncSources(contact),
          recommendedAction: this.getRecommendedAction(engagementScore, daysSinceActivity),
        };
      })
    );

    // Filter by engagement
    const filtered = contactInsights.filter(
      (c) => c.engagementScore >= minEngagement && c.engagementScore <= maxEngagement
    );

    // Sort
    const sorted = this.sortContactInsights(filtered, sortBy);

    // Get at-risk contacts (no activity 30+ days)
    const atRiskContacts = contactInsights
      .filter((c) => c.daysSinceActivity !== null && c.daysSinceActivity >= 30)
      .sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0))
      .slice(0, 5);

    // Engagement distribution
    const engagementDistribution = {
      cold: contactInsights.filter((c) => c.engagementScore <= 25).length,
      warm: contactInsights.filter((c) => c.engagementScore > 25 && c.engagementScore <= 50).length,
      hot: contactInsights.filter((c) => c.engagementScore > 50 && c.engagementScore <= 75).length,
      champion: contactInsights.filter((c) => c.engagementScore > 75).length,
    };

    return {
      topContacts: sorted.slice(0, limit),
      atRiskContacts,
      engagementDistribution,
      avgEngagement: Math.round(contactInsights.reduce((acc, c) => acc + c.engagementScore, 0) / contactInsights.length) || 0,
      totalAnalyzed: contactInsights.length,
      sortedBy: sortBy,
    };
  }

  // ============================================
  // ACTIVITY TIMELINE
  // ============================================

  async getActivityTimeline(userId: string, query: ActivityTimelineQueryDto): Promise<ActivityTimelineResponseDto> {
    const { type = ActivityType.ALL, contactId, startDate, endDate, limit = 50, offset = 0 } = query;

    const where: any = { userId };
    if (type !== ActivityType.ALL) {
      where.activityType = type;
    }
    if (contactId) {
      where.contactId = BigInt(contactId);
    }
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const [activities, totalCount] = await Promise.all([
      this.prisma.contactActivity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.contactActivity.count({ where }),
    ]);

    // Transform to ActivityItemDto
    const activityItems: ActivityItemDto[] = await Promise.all(
      activities.map(async (activity) => {
        const contact = activity.contactId
          ? await this.prisma.contact.findUnique({ where: { id: activity.contactId } })
          : null;

        return {
          id: activity.id.toString(),
          type: activity.activityType as ActivityType,
          description: activity.description || `${activity.activityType} activity`,
          contactId: activity.contactId?.toString() || null,
          contactName: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : null,
          dealId: null,
          dealName: null,
          metadata: activity.metadata as Record<string, any> || null,
          engagementScore: activity.engagementScore,
          occurredAt: activity.occurredAt.toISOString(),
          timeAgo: this.getTimeAgo(activity.occurredAt),
          icon: this.getActivityIcon(activity.activityType),
          color: this.getActivityColor(activity.activityType),
        };
      })
    );

    // Daily summary
    const dailySummary = await this.getDailySummary(userId, where.occurredAt);

    // Type breakdown
    const typeBreakdown = await this.prisma.contactActivity.groupBy({
      by: ['activityType'],
      where: { userId },
      _count: true,
    });

    // Most active contacts
    const mostActiveData = await this.prisma.contactActivity.groupBy({
      by: ['contactId'],
      where: { userId, contactId: { not: null } },
      _count: true,
      orderBy: { _count: { contactId: 'desc' } },
      take: 5,
    });

    const mostActiveContacts = await Promise.all(
      mostActiveData.map(async (item) => {
        const contact = await this.prisma.contact.findUnique({ where: { id: item.contactId! } });
        return {
          contactId: item.contactId!.toString(),
          contactName: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : 'Unknown',
          count: item._count,
        };
      })
    );

    return {
      activities: activityItems,
      dailySummary,
      totalCount,
      hasMore: offset + limit < totalCount,
      typeBreakdown: typeBreakdown.reduce((acc, item) => ({ ...acc, [item.activityType]: item._count }), {}),
      mostActiveContacts,
    };
  }

  // ============================================
  // REVENUE FORECAST
  // ============================================

  async getRevenueForecast(userId: string, query: RevenueForecastQueryDto): Promise<RevenueForecastResponseDto> {
    const { model = ForecastModel.WEIGHTED_AVERAGE, forecastPeriod = ForecastPeriod.MONTH_3, confidenceLevel = 80 } = query;

    // Get historical data (last 12 months)
    const historicalData = await this.getHistoricalRevenue(userId, 12);

    // Generate forecast
    const forecastMonths = this.getForecastMonths(forecastPeriod);
    const forecast = this.generateForecast(historicalData, forecastMonths, model, confidenceLevel);

    // Pipeline data
    const pipeline = await this.getPipelineData(userId);

    // Summary
    const summary = await this.getRevenueSummary(userId);

    return {
      forecast,
      historical: historicalData,
      pipeline,
      summary,
      totalForecast: forecast.reduce((acc, f) => acc + f.predicted, 0),
      forecastGrowthRate: this.calculateGrowthRate(historicalData, forecast),
      confidenceLevel,
      model,
      period: forecastPeriod,
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // CHART DATA
  // ============================================

  async getChartData(userId: string, query: ChartDataQueryDto): Promise<ChartDataResponseDto> {
    const { metric, chartType = ChartType.LINE, startDate, endDate, groupBy = 'month', dataPoints = 12 } = query;

    const dateRange = this.getChartDateRange(startDate, endDate, dataPoints, groupBy);
    
    let labels: string[] = [];
    let datasets: any[] = [];
    let summary: any = {};

    switch (metric) {
      case ChartMetric.CONTACTS_GROWTH:
        ({ labels, datasets, summary } = await this.getContactsGrowthData(userId, dateRange, groupBy));
        break;
      case ChartMetric.ENGAGEMENT_TREND:
        ({ labels, datasets, summary } = await this.getEngagementTrendData(userId, dateRange, groupBy));
        break;
      case ChartMetric.ACTIVITY_BY_TYPE:
        ({ labels, datasets, summary } = await this.getActivityByTypeData(userId, dateRange));
        break;
      case ChartMetric.SYNC_SOURCES:
        ({ labels, datasets, summary } = await this.getSyncSourcesData(userId));
        break;
      case ChartMetric.DEALS_BY_STAGE:
        ({ labels, datasets, summary } = await this.getDealsByStageData(userId));
        break;
      case ChartMetric.REVENUE_TREND:
        ({ labels, datasets, summary } = await this.getRevenueTrendData(userId, dateRange, groupBy));
        break;
      default:
        labels = [];
        datasets = [];
    }

    return {
      type: chartType,
      metric,
      labels,
      datasets,
      options: this.getChartOptions(metric, chartType),
      summary,
      dataFreshness: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private createKPIChange(current: number, previous: number): KPIChangeDto {
    const changePercent = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
    return {
      current,
      previous,
      changePercent,
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
    };
  }

  private getDateRange(period: TimePeriod = TimePeriod.MONTH, customStart?: string, customEnd?: string) {
    const now = new Date();
    let startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date;

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const duration = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - duration);
    } else {
      endDate = now;
      switch (period) {
        case TimePeriod.DAY:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          prevEndDate = new Date(startDate.getTime() - 1);
          break;
        case TimePeriod.WEEK:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          prevEndDate = new Date(startDate.getTime() - 1);
          break;
        case TimePeriod.QUARTER:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          prevEndDate = new Date(startDate.getTime() - 1);
          break;
        case TimePeriod.YEAR:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          prevEndDate = new Date(startDate.getTime() - 1);
          break;
        default: // MONTH
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          prevEndDate = new Date(startDate.getTime() - 1);
      }
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  private async calculateConversionRate(userId: string): Promise<number> {
    const totalDeals = await this.prisma.deal.count({ where: { userId } });
    const wonDeals = await this.prisma.deal.count({ where: { userId, stage: 'closed_won' } });
    return totalDeals === 0 ? 0 : Math.round((wonDeals / totalDeals) * 100);
  }

  private async calculateEngagementScore(contactId: bigint): Promise<number> {
    const activities = await this.prisma.contactActivity.findMany({
      where: { contactId },
      orderBy: { occurredAt: 'desc' },
      take: 30,
    });

    if (activities.length === 0) return 0;

    // Weight recent activities more heavily
    let score = 0;
    const now = Date.now();
    activities.forEach((activity, index) => {
      const daysSince = (now - activity.occurredAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.max(0, 1 - daysSince / 90); // Decay over 90 days
      score += activity.engagementScore * recencyWeight;
    });

    return Math.min(100, Math.round(score / activities.length));
  }

  private getEngagementLevel(score: number): 'cold' | 'warm' | 'hot' | 'champion' {
    if (score <= 25) return 'cold';
    if (score <= 50) return 'warm';
    if (score <= 75) return 'hot';
    return 'champion';
  }

  private getSyncSources(contact: any): string[] {
    const sources: string[] = [];
    if (contact.appleContactId) sources.push('apple');
    if (contact.googleContactId) sources.push('google');
    if (contact.outlookContactId) sources.push('outlook');
    return sources;
  }

  private getRecommendedAction(engagement: number, daysSinceActivity: number | null): string {
    if (daysSinceActivity !== null && daysSinceActivity > 60) return 'Re-engage: Schedule follow-up call';
    if (daysSinceActivity !== null && daysSinceActivity > 30) return 'Check-in: Send personalized email';
    if (engagement < 25) return 'Nurture: Add to email campaign';
    if (engagement < 50) return 'Engage: Share relevant content';
    if (engagement < 75) return 'Deepen: Schedule meeting';
    return 'Maintain: Continue regular touchpoints';
  }

  private sortContactInsights(contacts: ContactInsightDto[], sortBy: InsightSortBy): ContactInsightDto[] {
    switch (sortBy) {
      case InsightSortBy.ENGAGEMENT:
        return contacts.sort((a, b) => b.engagementScore - a.engagementScore);
      case InsightSortBy.RECENT_ACTIVITY:
        return contacts.sort((a, b) => (a.daysSinceActivity || 999) - (b.daysSinceActivity || 999));
      case InsightSortBy.DEAL_VALUE:
        return contacts.sort((a, b) => b.totalDealsValue - a.totalDealsValue);
      case InsightSortBy.SYNC_STATUS:
        return contacts.sort((a, b) => b.syncSources.length - a.syncSources.length);
      default:
        return contacts;
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  }

  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      email: 'mail',
      call: 'phone',
      meeting: 'calendar',
      note: 'file-text',
      task: 'check-square',
      deal_update: 'dollar-sign',
      contact_created: 'user-plus',
      contact_synced: 'refresh-cw',
    };
    return icons[type] || 'activity';
  }

  private getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      email: '#3B82F6',
      call: '#10B981',
      meeting: '#8B5CF6',
      note: '#F59E0B',
      task: '#6366F1',
      deal_update: '#EC4899',
      contact_created: '#06B6D4',
      contact_synced: '#14B8A6',
    };
    return colors[type] || '#6B7280';
  }

  private async getDailySummary(userId: string, dateFilter?: { gte?: Date; lte?: Date }): Promise<any[]> {
    const activities = await this.prisma.contactActivity.findMany({
      where: { userId, ...(dateFilter && { occurredAt: dateFilter }) },
      select: { occurredAt: true, activityType: true },
    });

    const byDate: Record<string, { total: number; byType: Record<string, number> }> = {};
    activities.forEach((a) => {
      const dateKey = a.occurredAt.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = { total: 0, byType: {} };
      byDate[dateKey].total++;
      byDate[dateKey].byType[a.activityType] = (byDate[dateKey].byType[a.activityType] || 0) + 1;
    });

    return Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
  }

  // Cache helpers
  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await this.prisma.analyticsCache.findUnique({ where: { key } });
      if (cached && cached.expiresAt > new Date()) {
        return cached.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async saveToCache(key: string, data: any): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.CACHE_TTL_MINUTES * 60 * 1000);
      await this.prisma.analyticsCache.upsert({
        where: { key },
        update: { data, expiresAt, updatedAt: new Date() },
        create: { key, data, expiresAt },
      });
    } catch (error) {
      this.logger.warn(`Cache save failed for ${key}:`, error);
    }
  }

  // Forecast helpers
  private async getHistoricalRevenue(userId: string, months: number): Promise<ForecastDataPointDto[]> {
    const data: ForecastDataPointDto[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const revenue = await this.prisma.deal.aggregate({
        where: {
          userId,
          stage: 'closed_won',
          closedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { value: true },
      });

      data.push({
        date: monthStart.toISOString().split('T')[0],
        month: monthStart.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        predicted: Number(revenue._sum.value || 0),
        actual: Number(revenue._sum.value || 0),
        lowerBound: Number(revenue._sum.value || 0),
        upperBound: Number(revenue._sum.value || 0),
        isForecast: false,
      });
    }

    return data;
  }

  private getForecastMonths(period: ForecastPeriod): number {
    const mapping: Record<ForecastPeriod, number> = {
      [ForecastPeriod.MONTH_1]: 1,
      [ForecastPeriod.MONTH_3]: 3,
      [ForecastPeriod.MONTH_6]: 6,
      [ForecastPeriod.YEAR_1]: 12,
    };
    return mapping[period];
  }

  private generateForecast(
    historical: ForecastDataPointDto[],
    months: number,
    model: ForecastModel,
    confidence: number
  ): ForecastDataPointDto[] {
    const values = historical.map((h) => h.actual || 0);
    const forecast: ForecastDataPointDto[] = [];
    const now = new Date();
    const confidenceMultiplier = (100 - confidence) / 100;

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      let predicted: number;

      switch (model) {
        case ForecastModel.LINEAR:
          predicted = this.linearForecast(values, i);
          break;
        case ForecastModel.EXPONENTIAL:
          predicted = this.exponentialForecast(values, i);
          break;
        default: // WEIGHTED_AVERAGE
          predicted = this.weightedAverageForecast(values);
      }

      const variance = predicted * confidenceMultiplier;
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        month: futureDate.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        predicted: Math.round(predicted),
        lowerBound: Math.round(predicted - variance),
        upperBound: Math.round(predicted + variance),
        isForecast: true,
      });
    }

    return forecast;
  }

  private linearForecast(values: number[], periodsAhead: number): number {
    if (values.length < 2) return values[values.length - 1] || 0;
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((acc, y, i) => acc + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return intercept + slope * (n + periodsAhead);
  }

  private exponentialForecast(values: number[], periodsAhead: number): number {
    const alpha = 0.3;
    let forecast = values[0] || 0;
    for (const value of values) {
      forecast = alpha * value + (1 - alpha) * forecast;
    }
    return forecast * Math.pow(1.02, periodsAhead); // 2% growth factor
  }

  private weightedAverageForecast(values: number[]): number {
    if (values.length === 0) return 0;
    const weights = values.map((_, i) => i + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    return values.reduce((acc, val, i) => acc + val * weights[i], 0) / weightSum;
  }

  private async getPipelineData(userId: string): Promise<PipelineStageDto[]> {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const colors: Record<string, string> = {
      lead: '#94A3B8',
      qualified: '#3B82F6',
      proposal: '#8B5CF6',
      negotiation: '#F59E0B',
      closed_won: '#10B981',
      closed_lost: '#EF4444',
    };

    return Promise.all(
      stages.map(async (stage) => {
        const deals = await this.prisma.deal.findMany({
          where: { userId, stage },
        });

        const count = deals.length;
        const value = deals.reduce((acc, d) => acc + Number(d.value), 0);
        const avgProbability = deals.length > 0
          ? Math.round(deals.reduce((acc, d) => acc + d.probability, 0) / deals.length)
          : 0;

        return {
          stage,
          label: stage.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          count,
          value,
          avgProbability,
          weightedValue: Math.round(value * (avgProbability / 100)),
          color: colors[stage],
        };
      })
    );
  }

  private async getRevenueSummary(userId: string): Promise<any> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearSameDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const [currentMonth, prevMonth, ytd, prevYtd, avgDeal, wonDeals, totalDeals] = await Promise.all([
      this.prisma.deal.aggregate({
        where: { userId, stage: 'closed_won', closedAt: { gte: currentMonthStart } },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { userId, stage: 'closed_won', closedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { userId, stage: 'closed_won', closedAt: { gte: yearStart } },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { userId, stage: 'closed_won', closedAt: { gte: prevYearStart, lte: prevYearSameDate } },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { userId, stage: 'closed_won' },
        _avg: { value: true },
      }),
      this.prisma.deal.count({ where: { userId, stage: 'closed_won' } }),
      this.prisma.deal.count({ where: { userId } }),
    ]);

    const currentVal = Number(currentMonth._sum.value || 0);
    const prevVal = Number(prevMonth._sum.value || 0);
    const ytdVal = Number(ytd._sum.value || 0);
    const prevYtdVal = Number(prevYtd._sum.value || 0);

    return {
      currentMonth: currentVal,
      previousMonth: prevVal,
      momChange: prevVal === 0 ? 100 : Math.round(((currentVal - prevVal) / prevVal) * 100),
      ytd: ytdVal,
      previousYtd: prevYtdVal,
      yoyChange: prevYtdVal === 0 ? 100 : Math.round(((ytdVal - prevYtdVal) / prevYtdVal) * 100),
      avgDealSize: Math.round(Number(avgDeal._avg.value || 0)),
      winRate: totalDeals === 0 ? 0 : Math.round((wonDeals / totalDeals) * 100),
      avgSalesCycle: 30, // Placeholder - calculate from actual deal data
    };
  }

  private calculateGrowthRate(historical: ForecastDataPointDto[], forecast: ForecastDataPointDto[]): number {
    if (historical.length === 0 || forecast.length === 0) return 0;
    const lastHistorical = historical[historical.length - 1].actual || 0;
    const lastForecast = forecast[forecast.length - 1].predicted;
    if (lastHistorical === 0) return 100;
    return Math.round(((lastForecast - lastHistorical) / lastHistorical) * 100);
  }

  // Chart data helpers
  private getChartDateRange(startDate?: string, endDate?: string, dataPoints: number = 12, groupBy: string = 'month') {
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (groupBy) {
        case 'day':
          start = new Date(end.getTime() - dataPoints * 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(end.getTime() - dataPoints * 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getFullYear(), end.getMonth() - dataPoints, 1);
      }
    }

    return { start, end };
  }

  private async getContactsGrowthData(userId: string, dateRange: { start: Date; end: Date }, groupBy: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId, createdAt: { gte: dateRange.start, lte: dateRange.end } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = this.groupByPeriod(contacts.map((c) => c.createdAt), groupBy);
    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    return {
      labels,
      datasets: [{
        label: 'Новые контакты',
        data,
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        fill: true,
        tension: 0.4,
      }],
      summary: this.calculateSummary(data),
    };
  }

  private async getEngagementTrendData(userId: string, dateRange: { start: Date; end: Date }, groupBy: string) {
    const activities = await this.prisma.contactActivity.findMany({
      where: { userId, occurredAt: { gte: dateRange.start, lte: dateRange.end } },
      select: { occurredAt: true, engagementScore: true },
    });

    const grouped: Record<string, number[]> = {};
    activities.forEach((a) => {
      const key = this.getGroupKey(a.occurredAt, groupBy);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a.engagementScore);
    });

    const labels = Object.keys(grouped).sort();
    const data = labels.map((k) => {
      const scores = grouped[k];
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    });

    return {
      labels,
      datasets: [{
        label: 'Средний engagement',
        data,
        backgroundColor: '#10B981',
        borderColor: '#059669',
        fill: false,
        tension: 0.4,
      }],
      summary: this.calculateSummary(data),
    };
  }

  private async getActivityByTypeData(userId: string, dateRange: { start: Date; end: Date }) {
    const activities = await this.prisma.contactActivity.groupBy({
      by: ['activityType'],
      where: { userId, occurredAt: { gte: dateRange.start, lte: dateRange.end } },
      _count: true,
    });

    const labels = activities.map((a) => a.activityType);
    const data = activities.map((a) => a._count);
    const colors = labels.map((l) => this.getActivityColor(l));

    return {
      labels,
      datasets: [{
        label: 'Активности по типу',
        data,
        backgroundColor: colors,
      }],
      summary: this.calculateSummary(data),
    };
  }

  private async getSyncSourcesData(userId: string) {
    const [apple, google, outlook, manual] = await Promise.all([
      this.prisma.contact.count({ where: { userId, appleContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, googleContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, outlookContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, appleContactId: null, googleContactId: null, outlookContactId: null } }),
    ]);

    return {
      labels: ['Apple', 'Google', 'Outlook', 'Вручную'],
      datasets: [{
        label: 'Источники контактов',
        data: [apple, google, outlook, manual],
        backgroundColor: ['#000000', '#EA4335', '#0078D4', '#6B7280'],
      }],
      summary: this.calculateSummary([apple, google, outlook, manual]),
    };
  }

  private async getDealsByStageData(userId: string) {
    const pipeline = await this.getPipelineData(userId);
    
    return {
      labels: pipeline.map((p) => p.label),
      datasets: [{
        label: 'Сделки по этапам',
        data: pipeline.map((p) => p.count),
        backgroundColor: pipeline.map((p) => p.color),
      }],
      summary: this.calculateSummary(pipeline.map((p) => p.count)),
    };
  }

  private async getRevenueTrendData(userId: string, dateRange: { start: Date; end: Date }, groupBy: string) {
    const deals = await this.prisma.deal.findMany({
      where: { userId, stage: 'closed_won', closedAt: { gte: dateRange.start, lte: dateRange.end } },
      select: { closedAt: true, value: true },
    });

    const grouped: Record<string, number> = {};
    deals.forEach((d) => {
      if (d.closedAt) {
        const key = this.getGroupKey(d.closedAt, groupBy);
        grouped[key] = (grouped[key] || 0) + Number(d.value);
      }
    });

    const labels = Object.keys(grouped).sort();
    const data = labels.map((k) => grouped[k]);

    return {
      labels,
      datasets: [{
        label: 'Выручка',
        data,
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        fill: true,
        tension: 0.4,
      }],
      summary: this.calculateSummary(data),
    };
  }

  private groupByPeriod(dates: Date[], groupBy: string): Record<string, number> {
    const grouped: Record<string, number> = {};
    dates.forEach((date) => {
      const key = this.getGroupKey(date, groupBy);
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }

  private getGroupKey(date: Date, groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
    }
  }

  private calculateSummary(data: number[]) {
    if (data.length === 0) return { total: 0, average: 0, min: 0, max: 0, trend: 'stable' as const, trendPercent: 0 };
    const total = data.reduce((a, b) => a + b, 0);
    const average = Math.round(total / data.length);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const firstHalf = data.slice(0, Math.floor(data.length / 2)).reduce((a, b) => a + b, 0);
    const secondHalf = data.slice(Math.floor(data.length / 2)).reduce((a, b) => a + b, 0);
    const trendPercent = firstHalf === 0 ? 100 : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    const trend = trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable';
    return { total, average, min, max, trend, trendPercent } as const;
  }

  private getChartOptions(metric: ChartMetric, chartType: ChartType) {
    const titles: Record<ChartMetric, string> = {
      [ChartMetric.CONTACTS_GROWTH]: 'Рост контактов',
      [ChartMetric.ENGAGEMENT_TREND]: 'Тренд вовлеченности',
      [ChartMetric.ACTIVITY_BY_TYPE]: 'Активности по типу',
      [ChartMetric.SYNC_SOURCES]: 'Источники синхронизации',
      [ChartMetric.DEALS_BY_STAGE]: 'Сделки по этапам',
      [ChartMetric.REVENUE_TREND]: 'Тренд выручки',
      [ChartMetric.CONVERSION_FUNNEL]: 'Воронка конверсии',
      [ChartMetric.CONTACTS_BY_COMPANY]: 'Контакты по компаниям',
    };

    return {
      title: titles[metric],
      showLegend: [ChartType.PIE, ChartType.DOUGHNUT].includes(chartType),
      legendPosition: 'bottom' as const,
      animated: true,
      responsive: true,
      maintainAspectRatio: false,
    };
  }
}
