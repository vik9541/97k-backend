import { Module } from '@nestjs/common';
import { AppleAuthService } from './apple-auth.service';
import { AppleAuthController } from './apple-auth.controller';
import { DatabaseModule } from '../../database/database.module';

// ============================================
// APPLE INTEGRATION MODULE
// OAuth 2.0 + CloudKit для Виктора Лаврентьева
// ============================================

@Module({
  imports: [DatabaseModule],
  controllers: [AppleAuthController],
  providers: [AppleAuthService],
  exports: [AppleAuthService],
})
export class AppleIntegrationModule {}
