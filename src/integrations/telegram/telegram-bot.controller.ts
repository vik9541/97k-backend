import {
  Controller,
  Post,
  Body,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TelegramBotService, TelegramUpdate } from './telegram-bot.service';

// ============================================
// TELEGRAM BOT CONTROLLER
// Webhook endpoint для @LavrentevViktor_bot
// ============================================

@Controller('api/telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);

  constructor(private readonly telegramService: TelegramBotService) {}

  /**
   * POST /api/telegram/webhook
   * Webhook для получения обновлений от Telegram
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: TelegramUpdate) {
    this.logger.log(`[WEBHOOK] Update received: ${update.update_id}`);
    
    // Обрабатываем асинхронно, сразу отвечаем Telegram
    setImmediate(() => {
      this.telegramService.handleUpdate(update).catch(err => {
        this.logger.error(`[WEBHOOK] Error processing update: ${err.message}`);
      });
    });

    return { ok: true };
  }

  /**
   * GET /api/telegram/health
   * Health check для бота
   */
  @Get('health')
  getHealth() {
    return {
      bot: '@LavrentevViktor_bot',
      status: 'active',
      owner: 'Лаврентьев Виктор Петрович',
      email: 'info@97v.ru',
      features: [
        'meetings',
        'tasks',
        'ideas',
        'contacts',
        'locations',
        'voice',
        'icloud_sync',
      ],
    };
  }

  /**
   * POST /api/telegram/notify
   * Отправка уведомления Виктору (internal API)
   */
  @Post('notify')
  async notifyVictor(@Body() body: { message: string }) {
    await this.telegramService.notifyVictor(body.message);
    return { sent: true };
  }

  /**
   * POST /api/telegram/set-webhook
   * Ручная установка webhook (для отладки)
   */
  @Post('set-webhook')
  async setWebhook() {
    await this.telegramService.setWebhook();
    return { success: true };
  }
}
