import { Module } from '@nestjs/common';
import { GoogleContactsService } from './google-contacts.service';
import { GoogleContactsController } from './google-contacts.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [GoogleContactsService],
  controllers: [GoogleContactsController],
  exports: [GoogleContactsService],
})
export class GoogleContactsModule {}
