import { Module } from '@nestjs/common';
import { AppleContactsService } from './apple-contacts.service';
import { AppleContactsController } from './apple-contacts.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AppleContactsService],
  controllers: [AppleContactsController],
  exports: [AppleContactsService],
})
export class AppleContactsModule {}
