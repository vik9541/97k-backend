import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';
import { DatabaseModule } from '../../database/database.module';

// ============================================
// TELEGRAM BOT MODULE
// @LavrentevViktor_bot - персональный бот Виктора
// ============================================

@Module({
  imports: [DatabaseModule],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
