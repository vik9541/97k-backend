import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OutlookContactsService } from './outlook-contacts.service';
import { SyncContactsDto, ResolveConflictDto } from './dto';

@Controller('api/outlook-contacts')
@ApiTags('outlook-contacts')
@ApiBearerAuth()
export class OutlookContactsController {
  constructor(private readonly outlookContactsService: OutlookContactsService) {}

  @Post('auth')
  @ApiOperation({ summary: 'Authenticate with Microsoft Account' })
  async authenticate(@Request() req, @Body() dto: SyncContactsDto) {
    return this.outlookContactsService.authenticate(req.user.id, dto.accessToken);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync contacts from Outlook' })
  async sync(@Request() req) {
    return this.outlookContactsService.syncContacts(req.user.id);
  }

  @Get('sync-status')
  @ApiOperation({ summary: 'Get sync status with source breakdown' })
  async getSyncStatus(@Request() req) {
    return this.outlookContactsService.getSyncStatus(req.user.id);
  }

  @Post('resolve-conflicts')
  @ApiOperation({ summary: 'Resolve 3-way conflicts' })
  async resolveConflict(@Request() req, @Body() dto: ResolveConflictDto) {
    return this.outlookContactsService.resolveConflict(dto.conflictId, dto.strategy);
  }

  @Get('multi-source')
  @ApiOperation({ summary: 'Get all 3-way synchronized contacts' })
  async getMultiSourceContacts(@Request() req) {
    return this.outlookContactsService.getMultiSourceContacts(req.user.id);
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Outlook integration' })
  async disconnect(@Request() req) {
    return this.outlookContactsService.disconnect(req.user.id);
  }
}
