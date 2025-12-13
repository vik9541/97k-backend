import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VictorICloudService } from './victor-icloud.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  VictorSyncRequestDto,
  VictorExportRequestDto,
  ExportFormat,
} from './dto/victor-icloud.dto';

// ============================================
// VICTOR iCLOUD CONTROLLER
// API для синхронизации iCloud Лаврентьева В.П.
// Email: info@97v.ru
// ============================================

@ApiTags('Victor iCloud Contacts')
@Controller('api/victor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VictorICloudController {
  constructor(private readonly victorService: VictorICloudService) {}

  // ============================================
  // SYNC ENDPOINTS
  // ============================================

  @Post('icloud/init')
  @ApiOperation({ summary: 'Инициализировать синхронизацию iCloud' })
  @ApiResponse({ status: 200, description: 'URL для авторизации на iPhone' })
  async initializeSync(@Request() req) {
    return this.victorService.initializeSync(req.user.id);
  }

  @Post('icloud/sync')
  @ApiOperation({ summary: 'Синхронизировать контакты из iCloud' })
  @ApiResponse({ status: 200, description: 'Результат синхронизации' })
  async syncContacts(
    @Request() req,
    @Body() dto: VictorSyncRequestDto,
  ) {
    return this.victorService.syncVictorContacts(req.user.id, dto);
  }

  // ============================================
  // CONTACTS ENDPOINTS
  // ============================================

  @Get('contacts')
  @ApiOperation({ summary: 'Получить все контакты Виктора' })
  @ApiResponse({ status: 200, description: 'Список контактов' })
  async getContacts(
    @Request() req,
    @Query('search') search?: string,
    @Query('company') company?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: 'fullName' | 'company' | 'updatedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.victorService.getVictorContacts(req.user.id, {
      search,
      company,
      tags: tags?.split(','),
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('contacts/stats')
  @ApiOperation({ summary: 'Статистика контактов Виктора' })
  @ApiResponse({ status: 200, description: 'Статистика' })
  async getStats(@Request() req) {
    return this.victorService.getVictorStats(req.user.id);
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Получить один контакт' })
  @ApiResponse({ status: 200, description: 'Контакт' })
  async getContact(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.victorService.getContact(req.user.id, id);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Удалить контакт' })
  @ApiResponse({ status: 200, description: 'Контакт удалён' })
  async deleteContact(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.victorService.deleteContact(req.user.id, id);
  }

  // ============================================
  // EXPORT ENDPOINTS
  // ============================================

  @Get('contacts/export')
  @ApiOperation({ summary: 'Экспортировать контакты Виктора' })
  @ApiResponse({ status: 200, description: 'Файл экспорта' })
  async exportContacts(
    @Request() req,
    @Res() res: Response,
    @Query('format') format?: ExportFormat,
    @Query('search') search?: string,
    @Query('company') company?: string,
    @Query('tags') tags?: string,
    @Query('includePhotos') includePhotos?: string,
  ) {
    const exportResult = await this.victorService.exportContacts(req.user.id, {
      format: format || ExportFormat.JSON,
      search,
      company,
      tags: tags?.split(','),
      includePhotos: includePhotos !== 'false',
    });

    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    
    if (typeof exportResult.data === 'string') {
      res.send(exportResult.data);
    } else {
      res.send(exportResult.data);
    }
  }

  @Get('contacts/export/json')
  @ApiOperation({ summary: 'Экспортировать в JSON' })
  @Header('Content-Type', 'application/json')
  async exportJSON(@Request() req) {
    const result = await this.victorService.exportContacts(req.user.id, {
      format: ExportFormat.JSON,
    });
    return JSON.parse(result.data as string);
  }

  @Get('contacts/export/csv')
  @ApiOperation({ summary: 'Экспортировать в CSV' })
  async exportCSV(@Request() req, @Res() res: Response) {
    const result = await this.victorService.exportContacts(req.user.id, {
      format: ExportFormat.CSV,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('contacts/export/vcard')
  @ApiOperation({ summary: 'Экспортировать в vCard' })
  async exportVCard(@Request() req, @Res() res: Response) {
    const result = await this.victorService.exportContacts(req.user.id, {
      format: ExportFormat.VCARD,
    });
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}
