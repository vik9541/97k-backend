import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { VictorSystemConnector } from './victor-system-connector.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ============================================
// VICTOR SYSTEM CONTROLLER
// API для управления системой Виктора
// ============================================

@Controller('api/victor/system')
export class VictorSystemController {
  private readonly logger = new Logger(VictorSystemController.name);

  constructor(private readonly systemConnector: VictorSystemConnector) {}

  /**
   * GET /api/victor/system/status
   * Статус всей системы Виктора
   */
  @Get('status')
  async getSystemStatus() {
    return this.systemConnector.getSystemStatus();
  }

  /**
   * POST /api/victor/system/sync
   * Запуск полной синхронизации
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async initializeSync(@CurrentUser() user: { id: string }) {
    this.logger.log(`[SYSTEM] Sync requested by user: ${user.id}`);
    return this.systemConnector.initializeFullSync();
  }

  /**
   * GET /api/victor/system/summary
   * Дневная сводка для Виктора
   */
  @Get('summary')
  async getDailySummary() {
    return this.systemConnector.getDailySummary();
  }

  /**
   * POST /api/victor/system/connect/apple
   * Подключение Apple iCloud
   */
  @Post('connect/apple')
  @UseGuards(JwtAuthGuard)
  async connectApple(@CurrentUser() user: { id: string }) {
    return this.systemConnector.connectApple(user.id);
  }

  /**
   * POST /api/victor/system/disconnect/apple
   * Отключение Apple iCloud
   */
  @Post('disconnect/apple')
  @UseGuards(JwtAuthGuard)
  async disconnectApple(@CurrentUser() user: { id: string }) {
    await this.systemConnector.disconnectApple(user.id);
    return { success: true, message: 'Apple iCloud disconnected' };
  }

  /**
   * POST /api/victor/system/export
   * Экспорт данных Виктора
   */
  @Post('export')
  @UseGuards(JwtAuthGuard)
  async exportData(@Body() body: { format?: 'json' | 'csv' }) {
    return this.systemConnector.exportVictorData(body.format || 'json');
  }

  /**
   * POST /api/victor/system/notify
   * Отправка уведомления Виктору
   */
  @Post('notify')
  async notifyVictor(@Body() body: { message: string }) {
    await this.systemConnector.notifyVictor(body.message);
    return { sent: true };
  }

  /**
   * GET /api/victor/system/health
   * Health check системы
   */
  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      owner: 'Лаврентьев Виктор Петрович',
      email: 'info@97v.ru',
      role: 'PRIMARY_ADMIN',
      timestamp: new Date(),
      services: {
        database: 'connected',
        apple: 'ready',
        telegram: 'ready',
      },
    };
  }
}
