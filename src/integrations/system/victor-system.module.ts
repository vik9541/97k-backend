import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VictorSystemConnector } from './victor-system-connector.service';
import { VictorSystemController } from './victor-system.controller';
import { DatabaseModule } from '../../database/database.module';
import { AppleIntegrationModule } from '../apple/apple.module';
import { TelegramBotModule } from '../telegram/telegram.module';

// ============================================
// VICTOR SYSTEM MODULE
// Центральный модуль системы Виктора
// ============================================

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AppleIntegrationModule,
    TelegramBotModule,
  ],
  controllers: [VictorSystemController],
  providers: [VictorSystemConnector],
  exports: [VictorSystemConnector],
})
export class VictorSystemModule {}
