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
import { AppleContactsService } from './apple-contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SyncContactsDto, ResolveConflictDto } from './dto';

@Controller('api/apple-contacts')
@UseGuards(JwtAuthGuard)
export class AppleContactsController {
  constructor(
    private readonly appleContactsService: AppleContactsService,
  ) {}

  @Post('sync')
  async sync(@Request() req, @Body() syncDto: SyncContactsDto) {
    return this.appleContactsService.syncContacts(req.user.id, syncDto);
  }

  @Get('status')
  async getStatus(@Request() req) {
    return this.appleContactsService.getSyncStatus(req.user.id);
  }

  @Get('conflicts')
  async getConflicts(@Request() req) {
    return this.appleContactsService.getConflicts(req.user.id);
  }

  @Post('conflicts/:id/resolve')
  async resolveConflict(
    @Param('id') conflictId: string,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.appleContactsService.resolveConflict(
      parseInt(conflictId),
      dto.strategy,
      dto.manualData,
    );
  }

  @Delete('disconnect')
  async disconnect(@Request() req) {
    return this.appleContactsService.disconnect(req.user.id);
  }
}
