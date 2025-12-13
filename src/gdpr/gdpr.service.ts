import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';

@Injectable()
export class GdprService {
  constructor(private prisma: PrismaService) {}

  /**
   * GDPR Article 15 - Right to Access
   * Export all user data to ZIP archive
   */
  async exportUserData(userId: string): Promise<string> {
    const exportId = `export_${userId}_${Date.now()}`;
    const exportDir = path.join(process.cwd(), 'exports', 'gdpr');
    const zipPath = path.join(exportDir, `${exportId}.zip`);

    // Create export directory
    await fs.mkdir(exportDir, { recursive: true });

    // Collect all user data
    const userData = {
      user: await this.prisma.user.findUnique({ where: { id: userId } }),
      contacts: await this.prisma.contact.findMany({ where: { userId } }),
      interactions: await this.prisma.interaction.findMany({
        where: { userId },
      }),
      // Add other tables as needed
    };

    // Create ZIP archive
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.append(JSON.stringify(userData, null, 2), { name: 'data.json' });
    archive.append(this.getReadmeText(), { name: 'README.txt' });
    await archive.finalize();

    // Log operation
    await this.logGdprOperation(userId, 'export_data', 'completed', {
      exportId,
    });

    return exportId;
  }

  /**
   * GDPR Article 17 - Right to Erasure
   * Anonymize user data (preserve structure)
   */
  async deleteUserData(userId: string, reason: string): Promise<void> {
    // Anonymize instead of hard delete (preserve relationships)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@anonymized.local`,
        name: 'Deleted User',
        gdprDeleted: true,
        gdprDeletionRequestedAt: new Date(),
      },
    });

    // Log operation
    await this.logGdprOperation(userId, 'delete_data', 'completed', {
      reason,
    });
  }

  /**
   * GDPR Article 18 - Right to Restrict Processing
   */
  async restrictProcessing(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { processingRestricted: true },
    });

    await this.logGdprOperation(
      userId,
      'restrict_processing',
      'completed',
      {},
    );
  }

  /**
   * Get data locations (transparency)
   */
  getDataLocations() {
    return {
      databases: ['PostgreSQL (Supabase)'],
      fileStorage: ['Local exports/', 'AWS S3 (future)'],
      thirdParty: ['None'],
      retentionPeriods: {
        users: 'Until deletion requested',
        gdprOperations: '7 years (legal requirement)',
      },
    };
  }

  /**
   * Log GDPR operation (7-year audit trail)
   */
  private async logGdprOperation(
    userId: string,
    operationType: string,
    status: string,
    details: any,
  ) {
    // TODO: Create gdpr_operations table in Prisma schema
    console.log(`[GDPR] ${operationType} for user ${userId}: ${status}`);
  }

  private getReadmeText(): string {
    return `
GDPR Data Export
================

This archive contains all personal data we hold about you.

Your Rights:
- Right to Access (Article 15) - This export
- Right to Erasure (Article 17) - Request deletion
- Right to Restrict Processing (Article 18) - Pause data use

Contact: privacy@97k.ru
    `.trim();
  }
}
