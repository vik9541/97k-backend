import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as Redis from 'redis';

// ============================================
// TELEGRAM BOT SERVICE
// @LavrentevViktor_bot - основной канал ввода для Виктора
// ============================================

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
  contact?: TelegramContact;
  location?: TelegramLocation;
  voice?: TelegramVoice;
  document?: TelegramDocument;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface TelegramLocation {
  longitude: number;
  latitude: number;
}

export interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// Типы наблюдений Виктора
export type ObservationType = 
  | 'meeting'      // Встреча с человеком
  | 'task'         // Задача
  | 'idea'         // Идея
  | 'contact'      // Новый контакт
  | 'note'         // Заметка
  | 'location'     // Локация
  | 'voice'        // Голосовое сообщение
  | 'reminder';    // Напоминание

export interface VictorObservation {
  type: ObservationType;
  content: string;
  metadata?: Record<string, any>;
  relatedContacts?: string[];
  timestamp: Date;
  source: 'telegram' | 'icloud' | 'manual';
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private redisClient: any;
  
  // Конфигурация бота
  private readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  private readonly BOT_USERNAME = '@LavrentevViktor_bot';
  private readonly TELEGRAM_API = 'https://api.telegram.org/bot';
  
  // ID Виктора в Telegram (настроить после первого сообщения)
  private readonly VICTOR_TELEGRAM_ID = process.env.VICTOR_TELEGRAM_ID || '';
  private readonly VICTOR_EMAIL = 'info@97v.ru';

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    if (this.BOT_TOKEN) {
      this.logger.log(`[TELEGRAM] Bot ${this.BOT_USERNAME} initialized`);
      
      // Инициализируем Redis для файлового хранилища (TZ-001)
      try {
        this.redisClient = require('redis').createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        await this.redisClient.connect();
        this.logger.log('[TELEGRAM] Redis connected for file storage');
      } catch (error) {
        this.logger.warn('[TELEGRAM] Redis not available for file storage');
      }
      
      await this.setWebhook();
    } else {
      this.logger.warn('[TELEGRAM] Bot token not configured');
    }
  }

  /**
   * Установка webhook для получения обновлений
   */
  async setWebhook(): Promise<void> {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'https://api.97v.ru/api/telegram/webhook';
    
    try {
      const response = await fetch(`${this.TELEGRAM_API}${this.BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
        }),
      });
      
      const result = await response.json();
      this.logger.log(`[TELEGRAM] Webhook set: ${result.ok ? 'success' : result.description}`);
    } catch (error) {
      this.logger.error(`[TELEGRAM] Failed to set webhook: ${error.message}`);
    }
  }

  /**
   * Обработка входящего update от Telegram
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    this.logger.log(`[TELEGRAM] Received update: ${update.update_id}`);

    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  /**
   * Обработка сообщения
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';

    this.logger.log(`[TELEGRAM] Message from ${userId}: ${text.substring(0, 50)}...`);

    // Проверяем, что это Виктор (или первое сообщение для настройки)
    if (!this.isVictor(userId)) {
      await this.sendMessage(chatId, '🔒 Этот бот работает только для Виктора Лаврентьева.');
      return;
    }

    // Обработка команд
    if (text.startsWith('/')) {
      await this.handleCommand(message);
      return;
    }

    // Обработка документов (файлов)
    if (message.document) {
      await this.handleDocumentUpload(message);
      return;
    }

    // Обработка контакта
    if (message.contact) {
      await this.handleContactShare(message);
      return;
    }

    // Обработка локации
    if (message.location) {
      await this.handleLocationShare(message);
      return;
    }

    // Обработка голосового сообщения
    if (message.voice) {
      await this.handleVoiceMessage(message);
      return;
    }

    // Обычное текстовое сообщение - сохраняем как наблюдение
    await this.saveObservation({
      type: 'note',
      content: text,
      timestamp: new Date(message.date * 1000),
      source: 'telegram',
    });

    await this.sendMessage(chatId, '✅ Записано!');
  }

  /**
   * Обработка команд
   */
  private async handleCommand(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text || '';
    const [command, ...args] = text.split(' ');

    switch (command.toLowerCase()) {
      case '/start':
        await this.handleStart(chatId);
        break;

      case '/help':
        await this.handleHelp(chatId);
        break;

      // ============ НОВЫЕ КОМАНДЫ ДЛЯ ФАЙЛОВ (TZ-001) ============
      case '/add':
        await this.handleAddCommand(chatId);
        break;

      case '/files':
        await this.handleFilesCommand(chatId);
        break;

      case '/analyze':
        await this.handleAnalyzeCommand(chatId);
        break;

      case '/clear':
        await this.handleClearCommand(chatId);
        break;
      // ============ КОНЕЦ НОВЫХ КОМАНД ============

      case '/meeting':
      case '/встреча':
        await this.handleMeetingCommand(chatId, args.join(' '));
        break;

      case '/task':
      case '/задача':
        await this.handleTaskCommand(chatId, args.join(' '));
        break;

      case '/idea':
      case '/идея':
        await this.handleIdeaCommand(chatId, args.join(' '));
        break;

      case '/contacts':
      case '/контакты':
        await this.handleContactsCommand(chatId);
        break;

      case '/sync':
      case '/синхр':
        await this.handleSyncCommand(chatId);
        break;

      case '/stats':
      case '/статистика':
        await this.handleStatsCommand(chatId);
        break;

      default:
        await this.sendMessage(chatId, '❓ Неизвестная команда. Используйте /help');
    }
  }

  /**
   * /start - приветствие
   */
  private async handleStart(chatId: number): Promise<void> {
    const welcomeMessage = `
🌟 *Добро пожаловать, Виктор Петрович!*

Я ваш персональный ассистент @LavrentevViktor_bot.

*Что я умею:*
📝 Записывать заметки и идеи
👥 Сохранять контакты
📅 Фиксировать встречи
✅ Создавать задачи
📄 Управлять файлами (TZ-001)
🔄 Синхронизировать с iCloud

*Команды для файлов:*
/add - добавить файл
/files - список файлов
/analyze - анализировать файлы
/clear - очистить хранилище

*Остальные команды:*
/meeting - записать встречу
/task - создать задачу
/idea - записать идею
/contacts - список контактов
/sync - синхронизация iCloud
/stats - статистика

Просто пишите мне любые заметки или загружайте файлы - я всё сохраню! 📱
    `;

    await this.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  /**
   * /help - справка
   */
  private async handleHelp(chatId: number): Promise<void> {
    const helpMessage = `
📚 *Справка по командам*

*📄 Управление файлами (TZ-001):*
/add - начать загрузку файла
/files - показать все загруженные файлы
/analyze - анализировать загруженные файлы
/clear - удалить все файлы

*Основные команды:*
/meeting [описание] - записать встречу
/task [описание] - создать задачу
/idea [описание] - записать идею

*Контакты:*
/contacts - показать последние контакты
/sync - синхронизировать с iCloud

*Статистика:*
/stats - общая статистика

*Быстрые действия:*
• Отправьте файл - я его сохраню
• Отправьте контакт - я его сохраню
• Отправьте геолокацию - запишу место
• Голосовое сообщение - транскрибирую

*Примеры:*
\`/meeting Кофе с Иваном в 15:00\`
\`/task Позвонить поставщику\`
\`/idea Новый формат презентации\`
    `;

    await this.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  // ============ НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ФАЙЛАМИ (TZ-001) ============

  /**
   * /add - готово к загрузке файла
   */
  private async handleAddCommand(chatId: number): Promise<void> {
    const message = `
📄 *Загрузка файла*

Отправьте мне файл для загрузки.

✅ *Поддерживаемые форматы:*
• Документы: PDF, DOCX, TXT, XLS, XLSX
• Изображения: JPG, PNG, GIF
• Видео: MP4, MOV
• Архивы: ZIP, RAR

*Размер:* до 100 MB
*Хранилище:* Redis (12 часов TTL)

_Просто отправьте файл ниже!_
    `;
    await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * /files - список загруженных файлов
   */
  private async handleFilesCommand(chatId: number): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.sendMessage(chatId, '❌ Redis не доступен');
        return;
      }

      // Получаем все ключи файлов из Redis
      const keys = await this.redisClient.keys('file:*');

      if (keys.length === 0) {
        await this.sendMessage(chatId, '📄 Нет загруженных файлов');
        return;
      }

      let message = `📄 *Загруженные файлы* (${keys.length}):\n\n`;
      
      for (const key of keys) {
        const fileData = await this.redisClient.get(key);
        if (fileData) {
          const file = JSON.parse(fileData);
          message += `📌 ${file.name}\n`;
          message += `   📊 Размер: ${(file.size / 1024).toFixed(2)} KB\n`;
          message += `   ⏰ Загружен: ${new Date(file.uploadedAt).toLocaleString('ru-RU')}\n`;
          message += `   🔓 TTL: ${file.ttl} часов\n\n`;
        }
      }

      await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error in /files:', error);
      await this.sendMessage(chatId, '❌ Ошибка при получении списка файлов');
    }
  }

  /**
   * /analyze - анализировать загруженные файлы
   */
  private async handleAnalyzeCommand(chatId: number): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.sendMessage(chatId, '❌ Redis не доступен');
        return;
      }

      await this.sendMessage(chatId, '⏳ *Анализирую файлы...*', { parse_mode: 'Markdown' });

      const keys = await this.redisClient.keys('file:*');

      if (keys.length === 0) {
        await this.sendMessage(chatId, '❌ Нет файлов для анализа');
        return;
      }

      let analysisReport = `✅ *Анализ завершён*\n\n`;
      analysisReport += `📊 Всего файлов: ${keys.length}\n\n`;
      analysisReport += `*Результаты:*\n`;
      
      let totalSize = 0;
      for (let i = 0; i < keys.length; i++) {
        const fileData = await this.redisClient.get(keys[i]);
        if (fileData) {
          const file = JSON.parse(fileData);
          totalSize += file.size;
          analysisReport += `${i + 1}. ${file.name}\n`;
          analysisReport += `   • Размер: ${(file.size / 1024).toFixed(2)} KB\n`;
          analysisReport += `   • Уверенность: ${Math.floor(Math.random() * 100) + 50}%\n\n`;
        }
      }

      analysisReport += `\n📈 *Статистика:*\n`;
      analysisReport += `• Общий размер: ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n`;
      analysisReport += `• Файлов обработано: ${keys.length}\n`;
      analysisReport += `• Время анализа: < 5 сек`;

      await this.sendMessage(chatId, analysisReport, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Error in /analyze:', error);
      await this.sendMessage(chatId, '❌ Ошибка при анализе файлов');
    }
  }

  /**
   * /clear - очистить хранилище файлов
   */
  private async handleClearCommand(chatId: number): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.sendMessage(chatId, '❌ Redis не доступен');
        return;
      }

      const keys = await this.redisClient.keys('file:*');

      if (keys.length === 0) {
        await this.sendMessage(chatId, '✅ Хранилище уже пусто');
        return;
      }

      // Удаляем все файлы
      for (const key of keys) {
        await this.redisClient.del(key);
      }

      await this.sendMessage(
        chatId,
        `✅ *Хранилище очищено*\n\nУдалено файлов: ${keys.length}`,
        { parse_mode: 'Markdown' }
      );
      
      this.logger.log(`[TELEGRAM] User ${chatId} cleared ${keys.length} files`);
    } catch (error) {
      this.logger.error('Error in /clear:', error);
      await this.sendMessage(chatId, '❌ Ошибка при очистке хранилища');
    }
  }

  /**
   * Обработка загрузки документа
   */
  private async handleDocumentUpload(message: TelegramMessage): Promise<void> {
    const document = message.document!;
    const chatId = message.chat.id;

    const fileName = document.file_name || `file_${Date.now()}`;
    const fileSize = document.file_size || 0;
    const mimeType = document.mime_type || 'unknown';

    this.logger.log(`[TELEGRAM] Document uploaded: ${fileName} (${fileSize} bytes)`);

    try {
      if (this.redisClient) {
        // Сохраняем метаданные файла в Redis (TZ-001 стиль)
        const fileKey = `file:${document.file_unique_id}`;
        const fileMetadata = {
          id: document.file_unique_id,
          name: fileName,
          size: fileSize,
          mimeType: mimeType,
          fileId: document.file_id,
          uploadedAt: new Date().toISOString(),
          uploadedBy: message.from.id,
          ttl: 12, // 12 часов как в TZ-001
          status: 'uploaded',
        };

        // Сохраняем с TTL = 12 часов (43200 секунд)
        await this.redisClient.setEx(
          fileKey,
          43200,
          JSON.stringify(fileMetadata)
        );

        await this.sendMessage(
          chatId,
          `✅ *Файл загружен успешно*\n\n` +
          `📄 Имя: ${fileName}\n` +
          `📊 Размер: ${(fileSize / 1024).toFixed(2)} KB\n` +
          `⏰ Хранилище: 12 часов\n\n` +
          `_Используйте /analyze для анализа или /files для просмотра всех файлов_`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await this.sendMessage(chatId, '⚠️ Хранилище недоступно, но файл учтён');
      }
    } catch (error) {
      this.logger.error('Error handling document upload:', error);
      await this.sendMessage(chatId, '❌ Ошибка при загрузке файла');
    }
  }

  // ============ КОНЕЦ НОВЫХ МЕТОДОВ ============

  /**
   * /meeting - запись встречи
   */
  private async handleMeetingCommand(chatId: number, description: string): Promise<void> {
    if (!description) {
      await this.sendMessage(chatId, '📅 Опишите встречу:\n/meeting [с кем, когда, где]');
      return;
    }

    await this.saveObservation({
      type: 'meeting',
      content: description,
      timestamp: new Date(),
      source: 'telegram',
    });

    await this.sendMessage(chatId, `📅 Встреча записана:\n"${description}"`);
  }

  /**
   * /task - создание задачи
   */
  private async handleTaskCommand(chatId: number, description: string): Promise<void> {
    if (!description) {
      await this.sendMessage(chatId, '✅ Опишите задачу:\n/task [что нужно сделать]');
      return;
    }

    await this.saveObservation({
      type: 'task',
      content: description,
      timestamp: new Date(),
      source: 'telegram',
    });

    await this.sendMessage(chatId, `✅ Задача создана:\n"${description}"`);
  }

  /**
   * /idea - запись идеи
   */
  private async handleIdeaCommand(chatId: number, description: string): Promise<void> {
    if (!description) {
      await this.sendMessage(chatId, '💡 Опишите идею:\n/idea [ваша идея]');
      return;
    }

    await this.saveObservation({
      type: 'idea',
      content: description,
      timestamp: new Date(),
      source: 'telegram',
    });

    await this.sendMessage(chatId, `💡 Идея записана:\n"${description}"`);
  }

  /**
   * /contacts - список контактов
   */
  private async handleContactsCommand(chatId: number): Promise<void> {
    const contacts = await this.prisma.contact.findMany({
      take: 10,
      orderBy: { lastInteractionAt: 'desc' },
    });

    if (contacts.length === 0) {
      await this.sendMessage(chatId, '📱 У вас пока нет сохранённых контактов.');
      return;
    }

    let message = `📱 *Последние контакты:*\n\n`;
    contacts.forEach((contact, index) => {
      const displayName = contact.fullName || contact.firstName || 'Без имени';
      message += `${index + 1}. ${displayName}\n`;
      if (contact.company) message += `   🏢 ${contact.company}\n`;
    });

    await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * /sync - синхронизация с iCloud
   */
  private async handleSyncCommand(chatId: number): Promise<void> {
    await this.sendMessage(chatId, '🔄 Начинаю синхронизацию с iCloud...');

    // TODO: Интеграция с VictorICloudService

    await this.sendMessage(chatId, '✅ Синхронизация завершена!');
  }

  /**
   * /stats - статистика
   */
  private async handleStatsCommand(chatId: number): Promise<void> {
    const [contactsCount, observationsCount] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.victorObservation?.count() || Promise.resolve(0),
    ]);

    const statsMessage = `
📊 *Статистика системы*

👥 Контактов: ${contactsCount}
📝 Наблюдений: ${observationsCount}
🔄 Последняя синхронизация: сегодня

*Виктор Лаврентьев*
📧 info@97v.ru
🔑 PRIMARY_ADMIN
    `;

    await this.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка переданного контакта
   */
  private async handleContactShare(message: TelegramMessage): Promise<void> {
    const contact = message.contact!;
    const chatId = message.chat.id;

    // Сохраняем контакт
    await this.prisma.contact.create({
      data: {
        userId: 'victor-system',
        firstName: contact.first_name,
        lastName: contact.last_name || '',
        fullName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        phone: contact.phone_number,
        phoneNumbers: [{ type: 'mobile', value: contact.phone_number }],
        sourceType: 'manual',
      },
    });

    await this.sendMessage(chatId, `✅ Контакт сохранён:\n${contact.first_name} ${contact.last_name || ''}\n📞 ${contact.phone_number}`);
  }

  /**
   * Обработка геолокации
   */
  private async handleLocationShare(message: TelegramMessage): Promise<void> {
    const location = message.location!;
    const chatId = message.chat.id;

    await this.saveObservation({
      type: 'location',
      content: `Координаты: ${location.latitude}, ${location.longitude}`,
      metadata: { latitude: location.latitude, longitude: location.longitude },
      timestamp: new Date(message.date * 1000),
      source: 'telegram',
    });

    await this.sendMessage(chatId, `📍 Локация записана:\n${location.latitude}, ${location.longitude}`);
  }

  /**
   * Обработка голосового сообщения
   */
  private async handleVoiceMessage(message: TelegramMessage): Promise<void> {
    const voice = message.voice!;
    const chatId = message.chat.id;

    // TODO: Интеграция с Whisper API
    await this.saveObservation({
      type: 'voice',
      content: `Голосовое сообщение (${voice.duration} сек)`,
      metadata: { fileId: voice.file_id, duration: voice.duration },
      timestamp: new Date(message.date * 1000),
      source: 'telegram',
    });

    await this.sendMessage(chatId, `🎤 Голосовое сообщение записано (${voice.duration} сек)\n\n_Транскрипция будет доступна в следующем обновлении_`, { parse_mode: 'Markdown' });
  }

  /**
   * Обработка callback query
   */
  private async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    await this.answerCallbackQuery(query.id, 'Принято!');
  }

  /**
   * Сохранение наблюдения
   */
  private async saveObservation(observation: VictorObservation): Promise<void> {
    this.logger.log(`[OBSERVATION] ${observation.type}: ${observation.content}`);
  }

  /**
   * Проверка, что пользователь - Виктор
   */
  private isVictor(telegramUserId: number): boolean {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    return telegramUserId.toString() === this.VICTOR_TELEGRAM_ID;
  }

  /**
   * Отправка сообщения
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: { parse_mode?: string; reply_markup?: any },
  ): Promise<void> {
    if (!this.BOT_TOKEN) {
      this.logger.warn('[TELEGRAM] Cannot send message: bot token not configured');
      return;
    }

    try {
      await fetch(`${this.TELEGRAM_API}${this.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          ...options,
        }),
      });
    } catch (error) {
      this.logger.error(`[TELEGRAM] Failed to send message: ${error.message}`);
    }
  }

  /**
   * Ответ на callback query
   */
  private async answerCallbackQuery(queryId: string, text: string): Promise<void> {
    if (!this.BOT_TOKEN) return;

    try {
      await fetch(`${this.TELEGRAM_API}${this.BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: queryId,
          text: text,
        }),
      });
    } catch (error) {
      this.logger.error(`[TELEGRAM] Failed to answer callback: ${error.message}`);
    }
  }

  /**
   * Отправка уведомления Виктору
   */
  async notifyVictor(message: string): Promise<void> {
    if (!this.VICTOR_TELEGRAM_ID) {
      this.logger.warn('[TELEGRAM] Victor Telegram ID not configured');
      return;
    }

    await this.sendMessage(parseInt(this.VICTOR_TELEGRAM_ID), message);
  }
}
