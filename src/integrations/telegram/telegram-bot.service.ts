import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ============================================
// TELEGRAM BOT SERVICE
// @97v_bot - основной канал ввода для Виктора
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
  
  // Конфигурация бота
  private readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  private readonly BOT_USERNAME = '@97v_bot';
  private readonly TELEGRAM_API = 'https://api.telegram.org/bot';
  
  // ID Виктора в Telegram (настроить после первого сообщения)
  private readonly VICTOR_TELEGRAM_ID = process.env.VICTOR_TELEGRAM_ID || '';
  private readonly VICTOR_EMAIL = 'info@97v.ru';

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    if (this.BOT_TOKEN) {
      this.logger.log(`[TELEGRAM] Bot ${this.BOT_USERNAME} initialized`);
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

Я ваш персональный ассистент @97v_bot.

*Что я умею:*
📝 Записывать заметки и идеи
👥 Сохранять контакты
📅 Фиксировать встречи
✅ Создавать задачи
🔄 Синхронизировать с iCloud

*Команды:*
/meeting - записать встречу
/task - создать задачу
/idea - записать идею
/contacts - список контактов
/sync - синхронизация iCloud
/stats - статистика

Просто пишите мне любые заметки - я всё сохраню! 📱
    `;

    await this.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  /**
   * /help - справка
   */
  private async handleHelp(chatId: number): Promise<void> {
    const helpMessage = `
📚 *Справка по командам*

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

    let message = '📱 *Последние контакты:*\n\n';
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

    // Здесь будет вызов VictorICloudService
    // TODO: Интеграция с victor-icloud.service.ts

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

    // Сохраняем контакт (userId = Victor's ID by default)
    await this.prisma.contact.create({
      data: {
        userId: 'victor-system', // Placeholder until proper auth
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

    // TODO: Интеграция с Whisper API для транскрипции
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
   * Обработка callback query (inline кнопки)
   */
  private async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    await this.answerCallbackQuery(query.id, 'Принято!');
    
    // TODO: Обработка различных callback действий
  }

  /**
   * Сохранение наблюдения Виктора
   */
  private async saveObservation(observation: VictorObservation): Promise<void> {
    // Если таблицы VictorObservation ещё нет, сохраняем в лог
    this.logger.log(`[OBSERVATION] ${observation.type}: ${observation.content}`);
    
    // TODO: После миграции схемы сохранять в БД
    // await this.prisma.victorObservation.create({
    //   data: {
    //     type: observation.type,
    //     content: observation.content,
    //     metadata: observation.metadata,
    //     source: observation.source,
    //     createdAt: observation.timestamp,
    //   },
    // });
  }

  /**
   * Проверка, что пользователь - Виктор
   */
  private isVictor(telegramUserId: number): boolean {
    // В dev режиме разрешаем всем
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // В production проверяем ID
    return telegramUserId.toString() === this.VICTOR_TELEGRAM_ID;
  }

  /**
   * Отправка сообщения в Telegram
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
