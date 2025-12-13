import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AnalyticsService, AnalyticsGateway],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule {}
