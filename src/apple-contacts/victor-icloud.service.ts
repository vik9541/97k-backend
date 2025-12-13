import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  VictorContactFullDto,
  VictorSyncRequestDto,
  VictorSyncResponseDto,
  VictorExportRequestDto,
  VictorContactsStatsDto,
  ExportFormat,
} from './dto/victor-icloud.dto';

// ============================================
// VICTOR iCLOUD SERVICE
// Полная синхронизация iCloud для Лаврентьева В.П.
// Email: info@97v.ru
// ============================================

@Injectable()
export class VictorICloudService {
  private readonly logger = new Logger(VictorICloudService.name);
  private readonly VICTOR_EMAIL = 'info@97v.ru';

  constructor(private prisma: PrismaService) {}

  /**
   * Инициализация синхронизации iCloud
   * Генерирует URL для авторизации на iPhone
   */
  async initializeSync(userId: string): Promise<{
    status: string;
    message: string;
    authUrl: string;
    syncId: string;
  }> {
    this.logger.log(`[VICTOR] Initializing iCloud sync for ${this.VICTOR_EMAIL}`);

    const syncId = `victor-sync-${Date.now()}`;

    // В production здесь будет Apple Sign-In OAuth URL
    const authUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${process.env.APPLE_CLIENT_ID || 'ru.97v.contacts'}` +
      `&redirect_uri=${encodeURIComponent(process.env.APPLE_REDIRECT_URI || 'https://api.97v.ru/api/apple-contacts/callback')}` +
      `&response_type=code` +
      `&scope=name%20email` +
      `&state=${syncId}`;

    // Создаём запись о синхронизации
    await this.prisma.appleContactsSync.upsert({
      where: { userId },
      create: {
        userId,
        syncToken: syncId,
        enabled: true,
        totalContactsSynced: 0,
      },
      update: {
        syncToken: syncId,
        enabled: true,
      },
    });

    return {
      status: 'pending_authorization',
      message: 'Пожалуйста, подтвердите доступ на вашем iPhone',
      authUrl,
      syncId,
    };
  }

  /**
   * Полная синхронизация контактов Виктора из iCloud
   */
  async syncVictorContacts(
    userId: string,
    dto: VictorSyncRequestDto,
  ): Promise<VictorSyncResponseDto> {
    const startTime = Date.now();
    this.logger.log(`[VICTOR] Starting full iCloud sync: ${dto.contacts.length} contacts`);
    this.logger.log(`[VICTOR] Device: ${dto.deviceName || 'Unknown'}, Full sync: ${dto.isFullSync}`);

    const results: VictorSyncResponseDto = {
      status: 'success',
      totalContacts: dto.contacts.length,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      errors: 0,
      photosDownloaded: 0,
      dataSizeMB: 0,
      syncToken: '',
      syncedAt: new Date().toISOString(),
      nextSyncRecommended: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 часов
      errorDetails: [],
    };

    let totalDataSize = 0;

    // Обрабатываем каждый контакт
    for (const contact of dto.contacts) {
      try {
        const result = await this.upsertVictorContact(userId, contact, dto.includePhotos);
        
        if (result.action === 'created') results.created++;
        else if (result.action === 'updated') results.updated++;
        else if (result.action === 'conflict') results.conflicts++;

        if (result.photoSize) {
          results.photosDownloaded++;
          totalDataSize += result.photoSize;
        }

        totalDataSize += this.estimateContactSize(contact);
      } catch (error) {
        results.errors++;
        results.errorDetails?.push(`Contact ${contact.appleContactId}: ${error.message}`);
        this.logger.error(`[VICTOR] Error syncing contact ${contact.fullName}:`, error);
      }
    }

    results.dataSizeMB = Math.round(totalDataSize / 1024 / 1024 * 100) / 100;

    // Обновляем метаданные синхронизации
    const newSyncToken = `victor-${Date.now()}-${results.totalContacts}`;
    await this.prisma.appleContactsSync.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        syncToken: newSyncToken,
        totalContactsSynced: { increment: results.created },
      },
    });

    results.syncToken = newSyncToken;

    // Проверяем статус
    if (results.errors > 0 && results.errors < results.totalContacts) {
      results.status = 'partial';
    } else if (results.errors >= results.totalContacts) {
      results.status = 'error';
    }

    const duration = Date.now() - startTime;
    this.logger.log(`[VICTOR] Sync complete in ${duration}ms:`, {
      created: results.created,
      updated: results.updated,
      conflicts: results.conflicts,
      errors: results.errors,
      photosDownloaded: results.photosDownloaded,
      dataSizeMB: results.dataSizeMB,
    });

    return results;
  }

  /**
   * Upsert одного контакта Виктора с полными данными
   */
  private async upsertVictorContact(
    userId: string,
    contact: VictorContactFullDto,
    includePhotos: boolean = true,
  ): Promise<{ action: 'created' | 'updated' | 'conflict'; photoSize?: number }> {
    // Ищем существующий контакт
    const existing = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { appleContactId: contact.appleContactId },
          { googleContactId: contact.googleContactId },
          { outlookContactId: contact.outlookContactId },
        ].filter(c => Object.values(c)[0]),
      },
    });

    // Формируем данные для записи
    const contactData = {
      userId,
      appleContactId: contact.appleContactId,
      googleContactId: contact.googleContactId,
      outlookContactId: contact.outlookContactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      email: contact.emails?.[0]?.email,
      phone: contact.phoneNumbers?.[0]?.number,
      company: contact.company,
      jobTitle: contact.jobTitle,
      notes: contact.notes,
      // Сохраняем расширенные данные как JSON
      phoneNumbers: contact.phoneNumbers as any,
      emails: contact.emails as any,
      addresses: contact.addresses as any,
      socialProfiles: contact.socialProfiles as any,
      birthday: contact.birthday ? new Date(contact.birthday) : null,
      tags: contact.tags || [],
      appleModifiedAt: new Date(contact.modifiedAt),
      syncVersion: existing ? { increment: 1 } : 1,
    };

    let photoSize = 0;

    // Обрабатываем фото
    if (includePhotos && contact.photo) {
      if (contact.photo.base64Data) {
        // Сохраняем base64 фото
        contactData['photoData'] = Buffer.from(contact.photo.base64Data, 'base64');
        photoSize = contact.photo.size || contact.photo.base64Data.length * 0.75;
      } else if (contact.photo.url) {
        contactData['photoUrl'] = contact.photo.url;
      }
    }

    if (!existing) {
      // Создаём новый контакт
      await this.prisma.contact.create({ data: contactData as any });
      return { action: 'created', photoSize };
    }

    // Проверяем конфликт
    if (existing.updatedAt > new Date(contact.modifiedAt)) {
      // Локальные изменения новее - создаём конфликт
      await this.prisma.syncConflict.create({
        data: {
          contactId: existing.id,
          userId,
          conflictType: 'update',
          localData: existing as any,
          remoteData: contact as any,
          resolved: false,
        },
      });
      return { action: 'conflict' };
    }

    // Обновляем существующий контакт
    await this.prisma.contact.update({
      where: { id: existing.id },
      data: contactData as any,
    });

    return { action: 'updated', photoSize };
  }

  /**
   * Получить все контакты Виктора
   */
  async getVictorContacts(
    userId: string,
    options?: {
      search?: string;
      company?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
      sortBy?: 'fullName' | 'company' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const where: any = { userId };

    if (options?.search) {
      where.OR = [
        { fullName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } },
        { company: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.company) {
      where.company = { contains: options.company, mode: 'insensitive' };
    }

    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: {
          [options?.sortBy || 'fullName']: options?.sortOrder || 'asc',
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    // Форматируем контакты для ответа
    const formattedContacts = contacts.map(c => this.formatContactResponse(c));

    return {
      contacts: formattedContacts,
      totalCount: total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      hasMore: (options?.offset || 0) + contacts.length < total,
      owner: {
        name: 'Лаврентьев Виктор Петрович',
        email: this.VICTOR_EMAIL,
      },
    };
  }

  /**
   * Экспорт контактов Виктора
   */
  async exportContacts(
    userId: string,
    options: VictorExportRequestDto,
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    const contacts = await this.getVictorContacts(userId, {
      search: options.search,
      company: options.company,
      tags: options.tags,
      limit: 10000, // Все контакты
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `victor_contacts_${timestamp}`;

    switch (options.format) {
      case ExportFormat.CSV:
        return {
          data: this.convertToCSV(contacts.contacts),
          filename: `${baseFilename}.csv`,
          mimeType: 'text/csv',
        };

      case ExportFormat.VCARD:
        return {
          data: this.convertToVCard(contacts.contacts),
          filename: `${baseFilename}.vcf`,
          mimeType: 'text/vcard',
        };

      case ExportFormat.PDF:
        return {
          data: await this.generatePDFReport(contacts.contacts),
          filename: `${baseFilename}.pdf`,
          mimeType: 'application/pdf',
        };

      case ExportFormat.JSON:
      default:
        return {
          data: JSON.stringify({
            exportedAt: new Date().toISOString(),
            owner: contacts.owner,
            totalContacts: contacts.totalCount,
            contacts: contacts.contacts,
          }, null, 2),
          filename: `${baseFilename}.json`,
          mimeType: 'application/json',
        };
    }
  }

  /**
   * Статистика контактов Виктора
   */
  async getVictorStats(userId: string): Promise<VictorContactsStatsDto> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalContacts,
      withPhotos,
      withPhones,
      withEmails,
      withCompanies,
      appleCount,
      googleCount,
      outlookCount,
      recentlyAdded,
      recentlyModified,
      syncRecord,
      topCompaniesRaw,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { userId } }),
      this.prisma.contact.count({ where: { userId, OR: [{ photoUrl: { not: null } }, { photoData: { not: null } }] } }),
      this.prisma.contact.count({ where: { userId, phone: { not: null } } }),
      this.prisma.contact.count({ where: { userId, email: { not: null } } }),
      this.prisma.contact.count({ where: { userId, company: { not: null } } }),
      this.prisma.contact.count({ where: { userId, appleContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, googleContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, outlookContactId: { not: null } } }),
      this.prisma.contact.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.contact.count({ where: { userId, updatedAt: { gte: sevenDaysAgo } } }),
      this.prisma.appleContactsSync.findUnique({ where: { userId } }),
      this.prisma.contact.groupBy({
        by: ['company'],
        where: { userId, company: { not: null } },
        _count: true,
        orderBy: { _count: { company: 'desc' } },
        take: 10,
      }),
    ]);

    // Примерный расчёт размера данных
    const avgContactSize = 2048; // ~2KB на контакт
    const avgPhotoSize = 500 * 1024; // ~500KB на фото
    const storageUsedMB = Math.round(
      (totalContacts * avgContactSize + withPhotos * avgPhotoSize) / 1024 / 1024 * 100
    ) / 100;

    return {
      totalContacts,
      withPhotos,
      withPhones,
      withEmails,
      withCompanies,
      bySource: {
        apple: appleCount,
        google: googleCount,
        outlook: outlookCount,
        manual: totalContacts - appleCount - googleCount - outlookCount,
      },
      topCompanies: topCompaniesRaw.map(c => ({
        company: c.company || 'Unknown',
        count: c._count,
      })),
      recentlyAdded,
      recentlyModified,
      lastSyncAt: syncRecord?.lastSyncAt?.toISOString() || null,
      storageUsedMB,
    };
  }

  /**
   * Получить один контакт по ID
   */
  async getContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: BigInt(contactId),
        userId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    return this.formatContactResponse(contact);
  }

  /**
   * Удалить контакт
   */
  async deleteContact(userId: string, contactId: string) {
    await this.prisma.contact.deleteMany({
      where: {
        id: BigInt(contactId),
        userId,
      },
    });

    return { success: true, message: 'Контакт удалён' };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatContactResponse(contact: any) {
    return {
      id: contact.id.toString(),
      appleContactId: contact.appleContactId,
      googleContactId: contact.googleContactId,
      outlookContactId: contact.outlookContactId,
      fullName: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      jobTitle: contact.jobTitle,
      phoneNumbers: contact.phoneNumbers || (contact.phone ? [{ type: 'mobile', number: contact.phone }] : []),
      emails: contact.emails || (contact.email ? [{ type: 'work', email: contact.email }] : []),
      addresses: contact.addresses || [],
      socialProfiles: contact.socialProfiles || [],
      photo: contact.photoUrl ? {
        url: contact.photoUrl,
      } : contact.photoData ? {
        url: `/api/apple-contacts/${contact.id}/photo`,
        hasData: true,
      } : null,
      birthday: contact.birthday?.toISOString()?.split('T')[0],
      notes: contact.notes,
      tags: contact.tags || [],
      engagementScore: contact.engagementScore || 0,
      lastInteractionAt: contact.lastInteractionAt?.toISOString(),
      syncSource: contact.appleContactId ? 'apple' : contact.googleContactId ? 'google' : contact.outlookContactId ? 'outlook' : 'manual',
      syncedAt: contact.appleModifiedAt?.toISOString() || contact.updatedAt?.toISOString(),
      createdAt: contact.createdAt?.toISOString(),
      updatedAt: contact.updatedAt?.toISOString(),
    };
  }

  private estimateContactSize(contact: VictorContactFullDto): number {
    // Примерный расчёт размера контакта в байтах
    let size = 0;
    size += (contact.fullName?.length || 0) * 2;
    size += (contact.company?.length || 0) * 2;
    size += (contact.notes?.length || 0) * 2;
    size += JSON.stringify(contact.phoneNumbers || []).length;
    size += JSON.stringify(contact.emails || []).length;
    size += JSON.stringify(contact.addresses || []).length;
    return size || 512; // минимум 512 байт
  }

  private convertToCSV(contacts: any[]): string {
    const headers = [
      'ID', 'Full Name', 'First Name', 'Last Name', 'Company', 'Job Title',
      'Phone', 'Email', 'Address', 'Birthday', 'Notes', 'Tags', 'Synced At'
    ];

    const rows = contacts.map(c => [
      c.id,
      c.fullName,
      c.firstName || '',
      c.lastName || '',
      c.company || '',
      c.jobTitle || '',
      c.phoneNumbers?.[0]?.number || '',
      c.emails?.[0]?.email || '',
      c.addresses?.[0] ? `${c.addresses[0].street || ''}, ${c.addresses[0].city || ''}`.trim() : '',
      c.birthday || '',
      (c.notes || '').replace(/"/g, '""'),
      (c.tags || []).join('; '),
      c.syncedAt || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Добавляем BOM для корректного отображения кириллицы в Excel
    return '\ufeff' + csvContent;
  }

  private convertToVCard(contacts: any[]): string {
    return contacts.map(c => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.fullName}`,
        c.firstName || c.lastName ? `N:${c.lastName || ''};${c.firstName || ''};;;` : '',
        c.company ? `ORG:${c.company}` : '',
        c.jobTitle ? `TITLE:${c.jobTitle}` : '',
        ...(c.phoneNumbers || []).map((p: any) => `TEL;TYPE=${p.type.toUpperCase()}:${p.number}`),
        ...(c.emails || []).map((e: any) => `EMAIL;TYPE=${e.type.toUpperCase()}:${e.email}`),
        c.birthday ? `BDAY:${c.birthday.replace(/-/g, '')}` : '',
        c.notes ? `NOTE:${c.notes.replace(/\n/g, '\\n')}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\r\n');

      return vcard;
    }).join('\r\n');
  }

  private async generatePDFReport(contacts: any[]): Promise<Buffer> {
    // Генерация PDF отчёта (упрощённая версия - в production использовать PDFKit или Puppeteer)
    const report = {
      title: 'Контакты Виктора Лаврентьева',
      generatedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      contacts: contacts.map(c => ({
        name: c.fullName,
        company: c.company,
        phone: c.phoneNumbers?.[0]?.number,
        email: c.emails?.[0]?.email,
      })),
    };

    // Возвращаем JSON как placeholder (в production генерировать реальный PDF)
    return Buffer.from(JSON.stringify(report, null, 2));
  }
}
