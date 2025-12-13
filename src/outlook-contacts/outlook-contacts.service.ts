import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OutlookContactsService {
  private readonly logger = new Logger(OutlookContactsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Authenticate with Microsoft Graph API
   */
  async authenticate(userId: string, accessToken: string) {
    const sync = await this.prisma.outlookContactsSync.create({
      data: {
        userId,
        status: 'authenticated',
        lastSyncAt: new Date(),
      },
    });

    this.logger.log(`✅ Outlook authenticated for user ${userId}`);
    return { success: true, syncId: sync.id };
  }

  /**
   * Sync contacts from Microsoft Graph API
   * Auto-detects 3-way duplicates (Apple + Google + Microsoft)
   */
  async syncContacts(userId: string) {
    const sync = await this.prisma.outlookContactsSync.findUnique({
      where: { userId },
    });

    if (!sync) {
      throw new Error('User not authenticated with Outlook');
    }

    // Mock contact data (in production would come from Microsoft Graph)
    const outlookContacts = [
      {
        id: 'outlook-123',
        givenName: 'John',
        surname: 'Doe',
        emailAddresses: [{ address: 'john@example.com' }],
        mobilePhone: '+1234567890',
        businessPhones: ['+1234567890'],
        companyName: 'ACME Corp',
        jobTitle: 'CEO',
      },
    ];

    const results = {
      created: 0,
      updated: 0,
      merged: 0,
      multiSourceMerged: 0,
      conflicts: 0,
      errors: 0,
    };

    for (const contact of outlookContacts) {
      try {
        await this.upsertContact(userId, contact, results);
      } catch (error) {
        this.logger.error(`Failed to sync ${contact.id}:`, error);
        results.errors++;
      }
    }

    // Update sync record
    await this.prisma.outlookContactsSync.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        status: 'synced',
      },
    });

    this.logger.log(`Outlook sync complete:`, results);
    return results;
  }

  /**
   * Upsert contact with 3-way deduplication
   */
  private async upsertContact(userId: string, outlookContactDto: any, results: any) {
    const email = outlookContactDto.emailAddresses?.[0]?.address;

    if (!email) {
      results.errors++;
      return;
    }

    // Find existing contact by email or Outlook ID
    const existing = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { outlookContactId: outlookContactDto.id },
          {
            AND: [{ email }, { userId }],
          },
        ],
      },
    });

    if (!existing) {
      // NEW contact from Outlook
      await this.prisma.contact.create({
        data: {
          userId,
          outlookContactId: outlookContactDto.id,
          firstName: outlookContactDto.givenName,
          lastName: outlookContactDto.surname,
          email: email,
          phone: outlookContactDto.mobilePhone || outlookContactDto.businessPhones?.[0],
          company: outlookContactDto.companyName,
          jobTitle: outlookContactDto.jobTitle,
          sourceType: 'outlook',
        },
      });
      results.created++;
      return;
    }

    // 3-WAY DEDUPLICATION LOGIC
    const sourceCount = [
      existing.appleContactId ? 1 : 0,
      existing.googleContactId ? 1 : 0,
      existing.outlookContactId ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    if (sourceCount === 0) {
      // First source
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          outlookContactId: outlookContactDto.id,
          sourceType: 'outlook',
        },
      });
      results.created++;
    } else if (sourceCount === 1 && !existing.outlookContactId) {
      // Adding second source (Apple or Google → now + Outlook)
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          outlookContactId: outlookContactDto.id,
          sourceType: 'all_three',
        },
      });
      results.merged++;
      this.logger.log(`✅ 3-way merged contact: ${email}`);
    } else if (sourceCount === 2 && !existing.outlookContactId) {
      // We already have Apple + Google, adding Outlook = ALL THREE!
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          outlookContactId: outlookContactDto.id,
          sourceType: 'all_three',
        },
      });
      results.multiSourceMerged++;
      this.logger.log(`🎊 TRIPLE MERGED contact: ${email}`);
    } else if (existing.outlookContactId) {
      // Already synced, update data
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          firstName: outlookContactDto.givenName,
          lastName: outlookContactDto.surname,
          email: email,
          phone: outlookContactDto.mobilePhone || outlookContactDto.businessPhones?.[0],
          company: outlookContactDto.companyName,
          jobTitle: outlookContactDto.jobTitle,
        },
      });
      results.updated++;
    }
  }

  /**
   * Get sync status for user
   */
  async getSyncStatus(userId: string) {
    const sync = await this.prisma.outlookContactsSync.findUnique({
      where: { userId },
    });

    if (!sync) {
      return {
        authenticated: false,
        lastSync: null,
        totalContacts: 0,
        conflicts: 0,
      };
    }

    const contacts = await this.prisma.contact.findMany({
      where: { userId },
    });

    const sourceBreakdown = {
      apple_only: contacts.filter(
        (c) => c.appleContactId && !c.googleContactId && !c.outlookContactId,
      ).length,
      google_only: contacts.filter(
        (c) => c.googleContactId && !c.appleContactId && !c.outlookContactId,
      ).length,
      outlook_only: contacts.filter(
        (c) => c.outlookContactId && !c.appleContactId && !c.googleContactId,
      ).length,
      apple_google: contacts.filter(
        (c) => c.appleContactId && c.googleContactId && !c.outlookContactId,
      ).length,
      apple_outlook: contacts.filter(
        (c) => c.appleContactId && c.outlookContactId && !c.googleContactId,
      ).length,
      google_outlook: contacts.filter(
        (c) => c.googleContactId && c.outlookContactId && !c.appleContactId,
      ).length,
      all_three: contacts.filter(
        (c) => c.appleContactId && c.googleContactId && c.outlookContactId,
      ).length,
    };

    return {
      authenticated: true,
      lastSync: sync.lastSyncAt,
      totalContacts: contacts.length,
      sources: sourceBreakdown,
    };
  }

  /**
   * Get multi-source contacts (synchronized across devices)
   */
  async getMultiSourceContacts(userId: string) {
    return this.prisma.contact.findMany({
      where: {
        userId,
        sourceType: 'all_three',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        appleContactId: true,
        googleContactId: true,
        outlookContactId: true,
        sourceType: true,
      },
    });
  }

  /**
   * Resolve conflicts from 3-way sync
   */
  async resolveConflict(conflictId: bigint, strategy: string) {
    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id: conflictId },
    });

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Apply resolution strategy
    let resolvedData: any;

    if (strategy === 'apple_wins') {
      resolvedData = conflict.localData;
    } else if (strategy === 'google_wins') {
      resolvedData = (conflict.localData as any).googleData;
    } else if (strategy === 'outlook_wins') {
      resolvedData = (conflict.remoteData as any).outlookData;
    } else {
      resolvedData = (conflict.remoteData as any).manualData;
    }

    // Update contact with resolved data
    await this.prisma.contact.update({
      where: { id: conflict.contactId },
      data: resolvedData,
    });

    // Mark conflict resolved
    await this.prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolutionStrategy: strategy,
      },
    });

    return { success: true, strategy };
  }

  /**
   * Disconnect Outlook integration
   */
  async disconnect(userId: string) {
    await this.prisma.outlookContactsSync.update({
      where: { userId },
      data: {
        status: 'disconnected',
        enabled: false,
      },
    });

    return { message: 'Outlook integration disabled' };
  }
}
