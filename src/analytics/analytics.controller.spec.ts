import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TimePeriod, InsightSortBy, ChartMetric, ChartType, ForecastModel, ForecastPeriod } from './dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockRequest = {
    user: { id: 'test-user-123' },
  };

  const mockAnalyticsService = {
    getDashboardKPIs: jest.fn(),
    getContactInsights: jest.fn(),
    getActivityTimeline: jest.fn(),
    getRevenueForecast: jest.fn(),
    getChartData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardKPIs', () => {
    it('should return dashboard KPIs', async () => {
      const mockKPIs = {
        totalContacts: { current: 100, previous: 90, changePercent: 11, trend: 'up' },
        period: TimePeriod.MONTH,
        cached: false,
      };

      mockAnalyticsService.getDashboardKPIs.mockResolvedValue(mockKPIs);

      const result = await controller.getDashboardKPIs(mockRequest, { period: TimePeriod.MONTH });

      expect(result).toEqual(mockKPIs);
      expect(mockAnalyticsService.getDashboardKPIs).toHaveBeenCalledWith('test-user-123', { period: TimePeriod.MONTH });
    });
  });

  describe('getContactInsights', () => {
    it('should return contact insights', async () => {
      const mockInsights = {
        topContacts: [],
        atRiskContacts: [],
        engagementDistribution: { cold: 10, warm: 20, hot: 15, champion: 5 },
        avgEngagement: 45,
        totalAnalyzed: 50,
        sortedBy: InsightSortBy.ENGAGEMENT,
      };

      mockAnalyticsService.getContactInsights.mockResolvedValue(mockInsights);

      const result = await controller.getContactInsights(mockRequest, { sortBy: InsightSortBy.ENGAGEMENT, limit: 10 });

      expect(result).toEqual(mockInsights);
      expect(mockAnalyticsService.getContactInsights).toHaveBeenCalledWith('test-user-123', { sortBy: InsightSortBy.ENGAGEMENT, limit: 10 });
    });
  });

  describe('getActivityTimeline', () => {
    it('should return activity timeline', async () => {
      const mockTimeline = {
        activities: [],
        dailySummary: [],
        totalCount: 100,
        hasMore: true,
        typeBreakdown: {},
        mostActiveContacts: [],
      };

      mockAnalyticsService.getActivityTimeline.mockResolvedValue(mockTimeline);

      const result = await controller.getActivityTimeline(mockRequest, { limit: 50 });

      expect(result).toEqual(mockTimeline);
      expect(mockAnalyticsService.getActivityTimeline).toHaveBeenCalledWith('test-user-123', { limit: 50 });
    });
  });

  describe('getRevenueForecast', () => {
    it('should return revenue forecast', async () => {
      const mockForecast = {
        forecast: [],
        historical: [],
        pipeline: [],
        summary: {},
        totalForecast: 100000,
        forecastGrowthRate: 15,
        confidenceLevel: 80,
        model: ForecastModel.WEIGHTED_AVERAGE,
        period: ForecastPeriod.MONTH_3,
        generatedAt: new Date().toISOString(),
      };

      mockAnalyticsService.getRevenueForecast.mockResolvedValue(mockForecast);

      const result = await controller.getRevenueForecast(mockRequest, { model: ForecastModel.WEIGHTED_AVERAGE });

      expect(result).toEqual(mockForecast);
      expect(mockAnalyticsService.getRevenueForecast).toHaveBeenCalledWith('test-user-123', { model: ForecastModel.WEIGHTED_AVERAGE });
    });
  });

  describe('getChartData', () => {
    it('should return chart data', async () => {
      const mockChartData = {
        type: ChartType.LINE,
        metric: ChartMetric.CONTACTS_GROWTH,
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Contacts', data: [10, 20, 30] }],
        options: { title: 'Contacts Growth' },
        summary: { total: 60, average: 20, min: 10, max: 30, trend: 'up', trendPercent: 50 },
        dataFreshness: new Date().toISOString(),
        dateRange: { start: '2024-01-01', end: '2024-03-31' },
      };

      mockAnalyticsService.getChartData.mockResolvedValue(mockChartData);

      const result = await controller.getChartData(mockRequest, { metric: ChartMetric.CONTACTS_GROWTH, chartType: ChartType.LINE });

      expect(result).toEqual(mockChartData);
      expect(mockAnalyticsService.getChartData).toHaveBeenCalledWith('test-user-123', { metric: ChartMetric.CONTACTS_GROWTH, chartType: ChartType.LINE });
    });
  });
});
