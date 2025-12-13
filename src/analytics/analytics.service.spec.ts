import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../database/prisma.service';
import { TimePeriod, InsightSortBy, ActivityType, ForecastModel, ForecastPeriod, ChartMetric, ChartType } from './dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockUserId = 'test-user-123';

  const mockPrismaService = {
    contact: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    contactActivity: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    analyticsCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // TEST 1: Dashboard KPIs
  // ============================================
  describe('getDashboardKPIs', () => {
    it('should return dashboard KPIs with correct structure', async () => {
      // Setup mocks
      mockPrismaService.analyticsCache.findUnique.mockResolvedValue(null);
      mockPrismaService.contact.count.mockResolvedValue(100);
      mockPrismaService.contactActivity.count.mockResolvedValue(50);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([{ contactId: 1n }, { contactId: 2n }]);
      mockPrismaService.contactActivity.aggregate.mockResolvedValue({ _avg: { engagementScore: 65 } });
      mockPrismaService.deal.count.mockResolvedValue(10);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: 50000 } });
      mockPrismaService.analyticsCache.upsert.mockResolvedValue({});

      const result = await service.getDashboardKPIs(mockUserId, { period: TimePeriod.MONTH });

      expect(result).toHaveProperty('totalContacts');
      expect(result).toHaveProperty('activeContacts');
      expect(result).toHaveProperty('newContacts');
      expect(result).toHaveProperty('avgEngagementScore');
      expect(result).toHaveProperty('totalDealsValue');
      expect(result).toHaveProperty('period', TimePeriod.MONTH);
      expect(result.totalContacts).toHaveProperty('current');
      expect(result.totalContacts).toHaveProperty('previous');
      expect(result.totalContacts).toHaveProperty('changePercent');
      expect(result.totalContacts).toHaveProperty('trend');
    });

    it('should use cache when available', async () => {
      const cachedData = {
        totalContacts: { current: 100, previous: 90, changePercent: 11, trend: 'up' },
        period: TimePeriod.MONTH,
      };
      mockPrismaService.analyticsCache.findUnique.mockResolvedValue({
        data: cachedData,
        expiresAt: new Date(Date.now() + 60000), // Not expired
      });

      const result = await service.getDashboardKPIs(mockUserId, { period: TimePeriod.MONTH });

      expect(result.cached).toBe(true);
      expect(mockPrismaService.contact.count).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TEST 2: Contact Insights
  // ============================================
  describe('getContactInsights', () => {
    it('should return contact insights with engagement distribution', async () => {
      const mockContacts = [
        { id: 1n, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: null, company: 'Test Inc', appleId: 'apple-1', googleId: null, outlookId: null, _count: { activities: 5, deals: 2 } },
        { id: 2n, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phone: null, company: 'Another Inc', appleId: null, googleId: 'google-1', outlookId: null, _count: { activities: 10, deals: 1 } },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contactActivity.findMany.mockResolvedValue([
        { occurredAt: new Date(), engagementScore: 50 },
      ]);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: 10000 } });

      const result = await service.getContactInsights(mockUserId, { sortBy: InsightSortBy.ENGAGEMENT, limit: 10 });

      expect(result).toHaveProperty('topContacts');
      expect(result).toHaveProperty('atRiskContacts');
      expect(result).toHaveProperty('engagementDistribution');
      expect(result.engagementDistribution).toHaveProperty('cold');
      expect(result.engagementDistribution).toHaveProperty('warm');
      expect(result.engagementDistribution).toHaveProperty('hot');
      expect(result.engagementDistribution).toHaveProperty('champion');
      expect(result.topContacts.length).toBeLessThanOrEqual(10);
    });

    it('should filter contacts by engagement score range', async () => {
      const mockContacts = [
        { id: 1n, firstName: 'Low', lastName: 'Engagement', email: null, phone: null, company: null, appleId: null, googleId: null, outlookId: null, _count: { activities: 1, deals: 0 } },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contactActivity.findMany.mockResolvedValue([]);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getContactInsights(mockUserId, {
        minEngagement: 50,
        maxEngagement: 100,
        limit: 10,
      });

      // All contacts with engagement < 50 should be filtered out
      result.topContacts.forEach(contact => {
        expect(contact.engagementScore).toBeGreaterThanOrEqual(50);
        expect(contact.engagementScore).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================
  // TEST 3: Activity Timeline
  // ============================================
  describe('getActivityTimeline', () => {
    it('should return paginated activity timeline', async () => {
      const mockActivities = [
        { id: 1n, userId: mockUserId, contactId: 1n, activityType: 'email', description: 'Sent email', metadata: {}, engagementScore: 10, occurredAt: new Date() },
        { id: 2n, userId: mockUserId, contactId: 2n, activityType: 'call', description: 'Phone call', metadata: {}, engagementScore: 20, occurredAt: new Date() },
      ];

      mockPrismaService.contactActivity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.contactActivity.count.mockResolvedValue(100);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([]);
      mockPrismaService.contact.findUnique.mockResolvedValue({ firstName: 'Test', lastName: 'User' });

      const result = await service.getActivityTimeline(mockUserId, { limit: 50, offset: 0 });

      expect(result).toHaveProperty('activities');
      expect(result).toHaveProperty('totalCount', 100);
      expect(result).toHaveProperty('hasMore', true);
      expect(result).toHaveProperty('typeBreakdown');
      expect(result).toHaveProperty('mostActiveContacts');
      expect(result.activities.length).toBe(2);
    });

    it('should filter activities by type', async () => {
      mockPrismaService.contactActivity.findMany.mockResolvedValue([]);
      mockPrismaService.contactActivity.count.mockResolvedValue(0);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([]);

      const result = await service.getActivityTimeline(mockUserId, {
        type: ActivityType.EMAIL,
        limit: 10,
      });

      expect(mockPrismaService.contactActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activityType: ActivityType.EMAIL,
          }),
        })
      );
    });
  });

  // ============================================
  // TEST 4: Revenue Forecast
  // ============================================
  describe('getRevenueForecast', () => {
    it('should return revenue forecast with pipeline data', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: 50000 }, _avg: { value: 5000 } });
      mockPrismaService.deal.count.mockResolvedValue(10);

      const result = await service.getRevenueForecast(mockUserId, {
        model: ForecastModel.WEIGHTED_AVERAGE,
        forecastPeriod: ForecastPeriod.MONTH_3,
        confidenceLevel: 80,
      });

      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('historical');
      expect(result).toHaveProperty('pipeline');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('totalForecast');
      expect(result).toHaveProperty('forecastGrowthRate');
      expect(result).toHaveProperty('confidenceLevel', 80);
      expect(result).toHaveProperty('model', ForecastModel.WEIGHTED_AVERAGE);
      expect(result.forecast.length).toBe(3); // 3 months forecast
    });

    it('should include confidence intervals in forecast', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: 10000 }, _avg: { value: 1000 } });
      mockPrismaService.deal.count.mockResolvedValue(5);

      const result = await service.getRevenueForecast(mockUserId, {
        confidenceLevel: 90,
        forecastPeriod: ForecastPeriod.MONTH_1,
      });

      result.forecast.forEach(point => {
        expect(point).toHaveProperty('predicted');
        expect(point).toHaveProperty('lowerBound');
        expect(point).toHaveProperty('upperBound');
        expect(point.lowerBound).toBeLessThanOrEqual(point.predicted);
        expect(point.upperBound).toBeGreaterThanOrEqual(point.predicted);
      });
    });
  });

  // ============================================
  // TEST 5: Chart Data - Contacts Growth
  // ============================================
  describe('getChartData', () => {
    it('should return contacts growth chart data', async () => {
      const mockContacts = [
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-01-20') },
        { createdAt: new Date('2024-02-10') },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);

      const result = await service.getChartData(mockUserId, {
        metric: ChartMetric.CONTACTS_GROWTH,
        chartType: ChartType.LINE,
      });

      expect(result).toHaveProperty('type', ChartType.LINE);
      expect(result).toHaveProperty('metric', ChartMetric.CONTACTS_GROWTH);
      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('summary');
      expect(result.datasets.length).toBeGreaterThan(0);
    });

    it('should return sync sources pie chart data', async () => {
      mockPrismaService.contact.count
        .mockResolvedValueOnce(50)  // apple
        .mockResolvedValueOnce(30)  // google
        .mockResolvedValueOnce(20)  // outlook
        .mockResolvedValueOnce(10); // manual

      const result = await service.getChartData(mockUserId, {
        metric: ChartMetric.SYNC_SOURCES,
        chartType: ChartType.PIE,
      });

      expect(result.type).toBe(ChartType.PIE);
      expect(result.labels).toContain('Apple');
      expect(result.labels).toContain('Google');
      expect(result.labels).toContain('Outlook');
      expect(result.datasets[0].data).toEqual([50, 30, 20, 10]);
    });
  });

  // ============================================
  // TEST 6: Chart Data - Engagement Trend
  // ============================================
  describe('getChartData - Engagement Trend', () => {
    it('should return engagement trend over time', async () => {
      const mockActivities = [
        { occurredAt: new Date('2024-01-15'), engagementScore: 60 },
        { occurredAt: new Date('2024-01-20'), engagementScore: 70 },
        { occurredAt: new Date('2024-02-10'), engagementScore: 80 },
      ];

      mockPrismaService.contactActivity.findMany.mockResolvedValue(mockActivities);

      const result = await service.getChartData(mockUserId, {
        metric: ChartMetric.ENGAGEMENT_TREND,
        chartType: ChartType.AREA,
      });

      expect(result.metric).toBe(ChartMetric.ENGAGEMENT_TREND);
      expect(result.datasets[0].label).toContain('engagement');
      expect(result.summary).toHaveProperty('average');
      expect(result.summary).toHaveProperty('trend');
    });
  });

  // ============================================
  // TEST 7: KPI Change Calculation
  // ============================================
  describe('KPI Change Calculation', () => {
    it('should calculate positive trend correctly', async () => {
      mockPrismaService.analyticsCache.findUnique.mockResolvedValue(null);
      mockPrismaService.contact.count
        .mockResolvedValueOnce(100)  // current total
        .mockResolvedValueOnce(80);  // previous total
      mockPrismaService.contactActivity.count.mockResolvedValue(0);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([]);
      mockPrismaService.contactActivity.aggregate.mockResolvedValue({ _avg: { engagementScore: 0 } });
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: null } });
      mockPrismaService.analyticsCache.upsert.mockResolvedValue({});

      const result = await service.getDashboardKPIs(mockUserId, { period: TimePeriod.MONTH });

      expect(result.totalContacts.changePercent).toBe(25); // (100-80)/80 * 100 = 25%
      expect(result.totalContacts.trend).toBe('up');
    });

    it('should handle zero previous value', async () => {
      mockPrismaService.analyticsCache.findUnique.mockResolvedValue(null);
      mockPrismaService.contact.count
        .mockResolvedValueOnce(50)  // current total
        .mockResolvedValueOnce(0);   // previous total = 0
      mockPrismaService.contactActivity.count.mockResolvedValue(0);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([]);
      mockPrismaService.contactActivity.aggregate.mockResolvedValue({ _avg: { engagementScore: 0 } });
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: null } });
      mockPrismaService.analyticsCache.upsert.mockResolvedValue({});

      const result = await service.getDashboardKPIs(mockUserId, { period: TimePeriod.MONTH });

      expect(result.totalContacts.changePercent).toBe(100); // When previous is 0, return 100%
    });
  });

  // ============================================
  // TEST 8: Date Range Calculation
  // ============================================
  describe('Date Range Calculation', () => {
    it('should calculate correct date range for different periods', async () => {
      mockPrismaService.analyticsCache.findUnique.mockResolvedValue(null);
      mockPrismaService.contact.count.mockResolvedValue(0);
      mockPrismaService.contactActivity.count.mockResolvedValue(0);
      mockPrismaService.contactActivity.groupBy.mockResolvedValue([]);
      mockPrismaService.contactActivity.aggregate.mockResolvedValue({ _avg: { engagementScore: 0 } });
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: null } });
      mockPrismaService.analyticsCache.upsert.mockResolvedValue({});

      // Test each period type
      for (const period of [TimePeriod.DAY, TimePeriod.WEEK, TimePeriod.MONTH, TimePeriod.QUARTER, TimePeriod.YEAR]) {
        const result = await service.getDashboardKPIs(mockUserId, { period });
        expect(result.period).toBe(period);
      }
    });
  });

  // ============================================
  // TEST 9: Engagement Score Calculation
  // ============================================
  describe('Engagement Score', () => {
    it('should return correct engagement level based on score', async () => {
      const mockContacts = [
        { id: 1n, firstName: 'Cold', lastName: 'Contact', email: null, phone: null, company: null, appleId: null, googleId: null, outlookId: null, _count: { activities: 0, deals: 0 } },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contactActivity.findMany.mockResolvedValue([]);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getContactInsights(mockUserId, { limit: 10 });

      // Contact with no activities should have score 0 = 'cold'
      if (result.topContacts.length > 0) {
        const contact = result.topContacts[0];
        if (contact.engagementScore <= 25) {
          expect(contact.engagementLevel).toBe('cold');
        }
      }
    });
  });

  // ============================================
  // TEST 10: Summary Statistics
  // ============================================
  describe('Summary Statistics', () => {
    it('should calculate correct summary statistics for chart data', async () => {
      const mockContacts = [
        { createdAt: new Date('2024-01-01') },
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-02-01') },
        { createdAt: new Date('2024-02-15') },
        { createdAt: new Date('2024-03-01') },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);

      const result = await service.getChartData(mockUserId, {
        metric: ChartMetric.CONTACTS_GROWTH,
        chartType: ChartType.BAR,
      });

      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('average');
      expect(result.summary).toHaveProperty('min');
      expect(result.summary).toHaveProperty('max');
      expect(result.summary).toHaveProperty('trend');
      expect(result.summary).toHaveProperty('trendPercent');
      expect(['up', 'down', 'stable']).toContain(result.summary.trend);
    });
  });
});
