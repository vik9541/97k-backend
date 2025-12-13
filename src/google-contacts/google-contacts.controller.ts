import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoogleContactsService } from './google-contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SyncContactsDto, ResolveConflictDto } from './dto';

@Controller('api/google-contacts')
@UseGuards(JwtAuthGuard)
export class GoogleContactsController {
  constructor(
    private readonly googleContactsService: GoogleContactsService,
  ) {}

  @Post('sync')
  async sync(@Request() req, @Body() syncDto: SyncContactsDto) {
    return this.googleContactsService.syncContacts(req.user.id, syncDto);
  }

  @Get('status')
  async getStatus(@Request() req) {
    return this.googleContactsService.getSyncStatus(req.user.id);
  }

  @Get('conflicts')
  async getConflicts(@Request() req) {
    return this.googleContactsService.getConflicts(req.user.id);
  }

  @Post('conflicts/:id/resolve')
  async resolveConflict(
    @Param('id') conflictId: string,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.googleContactsService.resolveConflict(
      parseInt(conflictId),
      dto.strategy,
      dto.manualData,
    );
  }

  @Delete('disconnect')
  async disconnect(@Request() req) {
    return this.googleContactsService.disconnect(req.user.id);
  }
}
