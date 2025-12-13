import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TimePeriod, ChartMetric, ChartType } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/analytics',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true,
  },
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private readonly refreshIntervals = new Map<string, ReturnType<typeof setInterval>>(); // userId -> interval

  constructor(private readonly analyticsService: AnalyticsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract userId from auth token (simplified - in production use proper JWT validation)
      const userId = client.handshake.auth?.userId || client.handshake.query?.userId as string;
      
      if (!userId) {
        this.logger.warn(`Client ${client.id} connected without userId`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      
      // Track connected clients per user
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId)!.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Send initial data
      await this.sendInitialData(client, userId);

      // Start auto-refresh if first client for this user
      if (this.connectedClients.get(userId)!.size === 1) {
        this.startAutoRefresh(userId);
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    
    if (userId && this.connectedClients.has(userId)) {
      this.connectedClients.get(userId)!.delete(client.id);
      
      // Stop auto-refresh if no more clients for this user
      if (this.connectedClients.get(userId)!.size === 0) {
        this.connectedClients.delete(userId);
        this.stopAutoRefresh(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe:dashboard')
  async handleSubscribeDashboard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { period?: TimePeriod },
  ) {
    if (!client.userId) return;

    try {
      const kpis = await this.analyticsService.getDashboardKPIs(client.userId, {
        period: data.period || TimePeriod.MONTH,
      });
      
      client.emit('dashboard:update', kpis);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch dashboard data' });
    }
  }

  @SubscribeMessage('subscribe:chart')
  async handleSubscribeChart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { metric: ChartMetric; chartType?: ChartType },
  ) {
    if (!client.userId) return;

    try {
      const chartData = await this.analyticsService.getChartData(client.userId, {
        metric: data.metric,
        chartType: data.chartType || ChartType.LINE,
      });
      
      client.emit('chart:update', { metric: data.metric, data: chartData });
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch chart data' });
    }
  }

  @SubscribeMessage('subscribe:activity')
  async handleSubscribeActivity(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { limit?: number },
  ) {
    if (!client.userId) return;

    try {
      const timeline = await this.analyticsService.getActivityTimeline(client.userId, {
        limit: data.limit || 20,
      });
      
      client.emit('activity:update', timeline);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch activity timeline' });
    }
  }

  @SubscribeMessage('refresh:all')
  async handleRefreshAll(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;
    await this.sendInitialData(client, client.userId);
  }

  // ============================================
  // BROADCAST METHODS (called from other services)
  // ============================================

  async broadcastDashboardUpdate(userId: string) {
    if (!this.connectedClients.has(userId)) return;

    try {
      const kpis = await this.analyticsService.getDashboardKPIs(userId, { period: TimePeriod.MONTH });
      this.server.to(`user:${userId}`).emit('dashboard:update', kpis);
    } catch (error) {
      this.logger.error(`Failed to broadcast dashboard update: ${error.message}`);
    }
  }

  async broadcastActivityUpdate(userId: string, activity: any) {
    this.server.to(`user:${userId}`).emit('activity:new', activity);
  }

  async broadcastChartUpdate(userId: string, metric: ChartMetric) {
    if (!this.connectedClients.has(userId)) return;

    try {
      const chartData = await this.analyticsService.getChartData(userId, { metric });
      this.server.to(`user:${userId}`).emit('chart:update', { metric, data: chartData });
    } catch (error) {
      this.logger.error(`Failed to broadcast chart update: ${error.message}`);
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async sendInitialData(client: AuthenticatedSocket, userId: string) {
    try {
      const [dashboard, contactInsights, recentActivity] = await Promise.all([
        this.analyticsService.getDashboardKPIs(userId, { period: TimePeriod.MONTH }),
        this.analyticsService.getContactInsights(userId, { limit: 5 }),
        this.analyticsService.getActivityTimeline(userId, { limit: 10 }),
      ]);

      client.emit('initial:data', {
        dashboard,
        contactInsights,
        recentActivity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to send initial data: ${error.message}`);
      client.emit('error', { message: 'Failed to load initial data' });
    }
  }

  private startAutoRefresh(userId: string) {
    // Refresh dashboard every 5 minutes
    const interval = setInterval(async () => {
      await this.broadcastDashboardUpdate(userId);
    }, 5 * 60 * 1000);

    this.refreshIntervals.set(userId, interval);
    this.logger.log(`Started auto-refresh for user ${userId}`);
  }

  private stopAutoRefresh(userId: string) {
    const interval = this.refreshIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(userId);
      this.logger.log(`Stopped auto-refresh for user ${userId}`);
    }
  }
}
