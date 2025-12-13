import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OutlookContactsService } from './outlook-contacts.service';
import { OutlookContactsController } from './outlook-contacts.controller';

@Module({
  imports: [DatabaseModule],
  providers: [OutlookContactsService],
  controllers: [OutlookContactsController],
})
export class OutlookContactsModule {}
