import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SyncContactsDto, ContactDto } from './dto';

@Injectable()
export class GoogleContactsService {
  private readonly logger = new Logger(GoogleContactsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Sync contacts from Android device to backend
   */
  async syncContacts(userId: string, dto: SyncContactsDto) {
    const { contacts, syncToken, isFullSync } = dto;

    this.logger.log(
      `Syncing ${contacts.length} Google contacts for user ${userId} (fullSync: ${isFullSync})`,
    );

    // Check if sync record exists
    let syncRecord = await this.prisma.googleContactsSync.findUnique({
      where: { userId },
    });

    if (!syncRecord) {
      // First sync - create sync record
      syncRecord = await this.prisma.googleContactsSync.create({
        data: {
          userId,
          lastSyncAt: new Date(),
          syncToken,
          totalContactsSynced: 0,
        },
      });
    }

    const results = {
      created: 0,
      updated: 0,
      merged: 0,
      conflicts: 0,
      errors: 0,
    };

    // Process each contact
    for (const contact of contacts) {
      try {
        await this.upsertContact(userId, contact, results);
      } catch (error) {
        this.logger.error(
          `Failed to sync contact ${contact.googleContactId}:`,
          error,
        );
        results.errors++;
      }
    }

    // Update sync metadata
    await this.prisma.googleContactsSync.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        syncToken,
        totalContactsSynced: { increment: results.created },
      },
    });

    this.logger.log(`Google sync complete for user ${userId}:`, results);
    return results;
  }

  /**
   * Upsert a single contact with multi-source merge support
   */
  private async upsertContact(
    userId: string,
    contactDto: ContactDto,
    results: any,
  ) {
    // Find existing contact by Google ID or email (multi-source support!)
    const existing = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { googleContactId: contactDto.googleContactId },
          {
            AND: [
              { email: contactDto.email },
              { userId: userId },
            ],
          },
        ],
      },
    });

    if (!existing) {
      // Create new contact
      await this.prisma.contact.create({
        data: {
          userId: userId,
          googleContactId: contactDto.googleContactId,
          firstName: contactDto.firstName,
          lastName: contactDto.lastName,
          email: contactDto.email,
          phone: contactDto.phone,
          company: contactDto.company,
          jobTitle: contactDto.jobTitle,
          notes: contactDto.notes,
          googleModifiedAt: new Date(contactDto.modifiedAt),
          sourceType: 'google',
          syncVersion: 1,
        },
      });
      results.created++;
      return;
    }

    // MULTI-SOURCE MERGE: Check if contact exists from Apple Contacts
    if (existing.appleContactId && !existing.googleContactId) {
      // This contact exists from Apple, now adding Google source!
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          googleContactId: contactDto.googleContactId,
          googleModifiedAt: new Date(contactDto.modifiedAt),
          sourceType: 'both', // MERGED!
        },
      });
      results.merged++;
      this.logger.log(`✅ Merged Apple+Google contact: ${existing.email}`);
      return;
    }

    // Check for conflict (local changes vs remote changes)
    const hasConflict = this.detectConflict(existing, contactDto);

    if (hasConflict) {
      // Log conflict for manual resolution
      await this.prisma.syncConflict.create({
        data: {
          contactId: existing.id,
          userId,
          conflictType: 'update',
          localData: existing as any,
          remoteData: contactDto as any,
          resolved: false,
        },
      });
      results.conflicts++;
      this.logger.warn(`Conflict detected for contact ${existing.id}`);
      return;
    }

    // No conflict - safe to update
    await this.prisma.contact.update({
      where: { id: existing.id },
      data: {
        googleContactId: contactDto.googleContactId,
        firstName: contactDto.firstName,
        lastName: contactDto.lastName,
        email: contactDto.email,
        phone: contactDto.phone,
        company: contactDto.company,
        jobTitle: contactDto.jobTitle,
        notes: contactDto.notes,
        googleModifiedAt: new Date(contactDto.modifiedAt),
        syncVersion: { increment: 1 },
      },
    });
    results.updated++;
  }

  /**
   * Detect if there's a conflict between local and remote changes
   */
  private detectConflict(local: any, remote: ContactDto): boolean {
    // If local was modified after Google contact, conflict exists
    if (local.updatedAt && local.updatedAt > new Date(remote.modifiedAt)) {
      return true;
    }

    return false;
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string) {
    const sync = await this.prisma.googleContactsSync.findUnique({
      where: { userId },
    });

    if (!sync) {
      return {
        enabled: false,
        lastSyncAt: null,
        totalContactsSynced: 0,
        conflicts: 0,
      };
    }

    const conflictsCount = await this.prisma.syncConflict.count({
      where: { userId, resolved: false },
    });

    return {
      enabled: sync.enabled,
      lastSyncAt: sync.lastSyncAt,
      totalContactsSynced: sync.totalContactsSynced,
      conflicts: conflictsCount,
    };
  }

  /**
   * Get unresolved conflicts
   */
  async getConflicts(userId: string) {
    return this.prisma.syncConflict.findMany({
      where: { userId, resolved: false },
      include: {
        contact: true,
      },
    });
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: number,
    strategy: 'local_wins' | 'remote_wins' | 'manual',
    manualData?: any,
  ) {
    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id: BigInt(conflictId) },
    });

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    let dataToApply: any;

    if (strategy === 'local_wins') {
      dataToApply = conflict.localData;
    } else if (strategy === 'remote_wins') {
      dataToApply = conflict.remoteData;
    } else {
      dataToApply = manualData;
    }

    // Apply resolution
    await this.prisma.contact.update({
      where: { id: conflict.contactId },
      data: dataToApply,
    });

    // Mark conflict as resolved
    await this.prisma.syncConflict.update({
      where: { id: BigInt(conflictId) },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolutionStrategy: strategy,
      },
    });

    return { success: true, strategy };
  }

  /**
   * Disconnect Google Contacts sync
   */
  async disconnect(userId: string) {
    await this.prisma.googleContactsSync.update({
      where: { userId },
      data: { enabled: false },
    });

    return { message: 'Google Contacts sync disabled' };
  }
}
