import { Module } from '@nestjs/common';
import { AppleContactsService } from './apple-contacts.service';
import { AppleContactsController } from './apple-contacts.controller';
import { VictorICloudService } from './victor-icloud.service';
import { VictorICloudController } from './victor-icloud.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AppleContactsService, VictorICloudService],
  controllers: [AppleContactsController, VictorICloudController],
  exports: [AppleContactsService, VictorICloudService],
})
export class AppleContactsModule {}
