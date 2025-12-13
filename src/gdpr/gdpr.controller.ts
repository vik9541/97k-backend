import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { GdprService } from './gdpr.service';

@Controller('api/gdpr')
export class GdprController {
  constructor(private gdprService: GdprService) {}

  @Post('export')
  async exportData(@Body('userId') userId: string) {
    const exportId = await this.gdprService.exportUserData(userId);
    return { exportId, message: 'Export started' };
  }

  @Post('delete')
  async deleteData(
    @Body('userId') userId: string,
    @Body('reason') reason: string,
  ) {
    await this.gdprService.deleteUserData(userId, reason);
    return { message: 'Data anonymization completed' };
  }

  @Post('restrict')
  async restrictProcessing(@Body('userId') userId: string) {
    await this.gdprService.restrictProcessing(userId);
    return { message: 'Processing restricted' };
  }

  @Get('data-locations')
  getDataLocations() {
    return this.gdprService.getDataLocations();
  }
}
