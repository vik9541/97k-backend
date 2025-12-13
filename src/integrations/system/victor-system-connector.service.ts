import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppleAuthService } from '../apple/apple-auth.service';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// ============================================
// VICTOR SYSTEM CONNECTOR
// Центральный хаб интеграций для Виктора
// ============================================

export interface SystemStatus {
  apple: {
    connected: boolean;
    lastSync?: Date;
    contactsCount?: number;
  };
  telegram: {
    connected: boolean;
    botUsername: string;
  };
  database: {
    connected: boolean;
    contactsCount: number;
    observationsCount: number;
  };
}

export interface SyncEvent {
  type: 'contacts_synced' | 'contact_created' | 'observation_saved' | 'meeting_scheduled';
  data: any;
  timestamp: Date;
  source: 'apple' | 'telegram' | 'manual' | 'system';
}

@Injectable()
export class VictorSystemConnector implements OnModuleInit {
  private readonly logger = new Logger(VictorSystemConnector.name);
  
  // Victor конфигурация
  private readonly VICTOR_EMAIL = 'info@97v.ru';
  private readonly VICTOR_ROLE = 'PRIMARY_ADMIN';

  constructor(
    private prisma: PrismaService,
    private appleAuth: AppleAuthService,
    private telegramBot: TelegramBotService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('🌟 Victor System Connector initializing...');
    
    // Подписываемся на события
    this.setupEventListeners();
    
    // Проверяем статус системы
    const status = await this.getSystemStatus();
    this.logger.log(`[SYSTEM] Status: Apple=${status.apple.connected}, Telegram=${status.telegram.connected}, DB=${status.database.connected}`);
    
    // Уведомляем Виктора если настроен Telegram
    if (process.env.VICTOR_TELEGRAM_ID) {
      await this.telegramBot.notifyVictor('🟢 Система запущена и готова к работе!');
    }
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners() {
    // Событие синхронизации контактов
    this.eventEmitter.on('contacts.synced', async (data: { count: number; source: string }) => {
      this.logger.log(`[EVENT] Contacts synced: ${data.count} from ${data.source}`);
      await this.notifyVictor(`🔄 Синхронизировано ${data.count} контактов из ${data.source}`);
    });

    // Событие создания контакта
    this.eventEmitter.on('contact.created', async (contact: any) => {
      this.logger.log(`[EVENT] Contact created: ${contact.name}`);
    });

    // Событие сохранения наблюдения
    this.eventEmitter.on('observation.saved', async (observation: any) => {
      this.logger.log(`[EVENT] Observation saved: ${observation.type}`);
    });
  }

  /**
   * Получение статуса системы
   */
  async getSystemStatus(): Promise<SystemStatus> {
    // Ищем пользователя Victor
    const victorUser = await this.prisma.user.findFirst({
      where: { email: this.VICTOR_EMAIL },
    });

    // Проверяем Apple подключение
    let appleConnected = false;
    let lastAppleSync: Date | undefined;
    
    if (victorUser) {
      const appleSync = await this.prisma.appleContactsSync.findUnique({
        where: { userId: victorUser.id },
      });
      appleConnected = appleSync?.enabled || false;
      lastAppleSync = appleSync?.lastSyncAt || undefined;
    }

    // Подсчёт контактов и наблюдений
    const contactsCount = await this.prisma.contact.count();
    
    return {
      apple: {
        connected: appleConnected,
        lastSync: lastAppleSync,
        contactsCount: contactsCount,
      },
      telegram: {
        connected: !!process.env.TELEGRAM_BOT_TOKEN,
        botUsername: '@LavrentevViktor_bot',
      },
      database: {
        connected: true,
        contactsCount: contactsCount,
        observationsCount: 0, // TODO: после создания таблицы
      },
    };
  }

  /**
   * Инициализация полной синхронизации
   */
  async initializeFullSync(): Promise<{
    success: boolean;
    results: {
      apple: { synced: number; errors: number };
      telegram: { connected: boolean };
    };
  }> {
    this.logger.log('[SYNC] Starting full system sync for Victor...');
    
    const results = {
      apple: { synced: 0, errors: 0 },
      telegram: { connected: false },
    };

    // 1. Проверяем Apple подключение
    const victorUser = await this.prisma.user.findFirst({
      where: { email: this.VICTOR_EMAIL },
    });

    if (victorUser) {
      const appleValid = await this.appleAuth.validateToken(victorUser.id);
      if (appleValid) {
        // TODO: Вызов VictorICloudService.syncVictorContacts()
        results.apple.synced = 0; // Placeholder
      }
    }

    // 2. Проверяем Telegram
    results.telegram.connected = !!process.env.TELEGRAM_BOT_TOKEN;

    // 3. Emit событие завершения
    this.eventEmitter.emit('sync.completed', {
      timestamp: new Date(),
      results,
    });

    // Уведомляем Виктора
    await this.notifyVictor(
      `✅ Синхронизация завершена!\n` +
      `📱 Apple: ${results.apple.synced} контактов\n` +
      `💬 Telegram: ${results.telegram.connected ? 'подключён' : 'не настроен'}`
    );

    return { success: true, results };
  }

  /**
   * Подключение Apple iCloud
   */
  async connectApple(userId: string): Promise<{ authUrl: string }> {
    const state = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now(),
      purpose: 'icloud_connect',
    })).toString('base64');

    const authUrl = this.appleAuth.generateAuthUrl(state);
    
    this.logger.log(`[APPLE] Generated auth URL for user: ${userId}`);
    
    return { authUrl };
  }

  /**
   * Отключение Apple iCloud
   */
  async disconnectApple(userId: string): Promise<void> {
    await this.appleAuth.revokeAccess(userId);
    
    this.eventEmitter.emit('apple.disconnected', { userId, timestamp: new Date() });
    
    await this.notifyVictor('🔌 Apple iCloud отключён');
  }

  /**
   * Обработка события из Telegram
   */
  async handleTelegramEvent(event: {
    type: string;
    data: any;
  }): Promise<void> {
    this.logger.log(`[TELEGRAM] Event received: ${event.type}`);

    switch (event.type) {
      case 'contact_shared':
        // Сохраняем контакт и синхронизируем
        this.eventEmitter.emit('contact.created', event.data);
        break;

      case 'sync_requested':
        // Запускаем синхронизацию
        await this.initializeFullSync();
        break;

      case 'meeting_created':
        // Обрабатываем создание встречи
        this.eventEmitter.emit('meeting.created', event.data);
        break;
    }
  }

  /**
   * Отправка уведомления Виктору
   */
  async notifyVictor(message: string): Promise<void> {
    await this.telegramBot.notifyVictor(message);
  }

  /**
   * Получение сводки для Виктора
   */
  async getDailySummary(): Promise<{
    date: Date;
    contacts: { total: number; new: number };
    observations: { total: number; today: number };
    meetings: { today: number; upcoming: number };
    tasks: { pending: number; completed: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalContacts, newContacts] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.contact.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      date: new Date(),
      contacts: {
        total: totalContacts,
        new: newContacts,
      },
      observations: {
        total: 0,
        today: 0,
      },
      meetings: {
        today: 0,
        upcoming: 0,
      },
      tasks: {
        pending: 0,
        completed: 0,
      },
    };
  }

  /**
   * Экспорт данных Виктора
   */
  async exportVictorData(format: 'json' | 'csv' = 'json'): Promise<{
    filename: string;
    data: string;
    mimeType: string;
  }> {
    const contacts = await this.prisma.contact.findMany();
    
    const filename = `victor_export_${Date.now()}.${format}`;
    let data: string;
    let mimeType: string;

    if (format === 'json') {
      data = JSON.stringify({
        exportedAt: new Date(),
        owner: {
          name: 'Лаврентьев Виктор Петрович',
          email: this.VICTOR_EMAIL,
          role: this.VICTOR_ROLE,
        },
        contacts,
      }, null, 2);
      mimeType = 'application/json';
    } else {
      // CSV format
      const headers = ['id', 'fullName', 'email', 'phone', 'company', 'createdAt'];
      const rows = contacts.map(c => [
        c.id,
        c.fullName || c.firstName || '',
        c.email || '',
        c.phone || '',
        c.company || '',
        c.createdAt.toISOString(),
      ].join(','));
      data = [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
    }

    return { filename, data, mimeType };
  }
}
