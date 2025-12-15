import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { Update, On, Hears } from 'telegraf-decorators';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);
  private uploadDir = './uploads';

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    this.bot = new Telegraf(botToken);
    this.setupHandlers();
  }

  private setupHandlers() {
    // /start - приветствие
    this.bot.command('start', (ctx) => this.handleStart(ctx));

    // /add - добавить файл
    this.bot.command('add', (ctx) => this.handleAdd(ctx));

    // /files - список файлов
    this.bot.command('files', (ctx) => this.handleFiles(ctx));

    // /analyze - анализ
    this.bot.command('analyze', (ctx) => this.handleAnalyze(ctx));

    // /clear - очистить
    this.bot.command('clear', (ctx) => this.handleClear(ctx));

    // Обработка файлов (документы)
    this.bot.on('document', (ctx) => this.handleDocument(ctx));

    // Обработка ошибок
    this.bot.catch((err) => {
      this.logger.error('Bot error:', err);
    });
  }

  /**
   * /start - Приветствие и меню
   */
  private async handleStart(ctx: Context) {
    const message = `
🤖 Привет, ${ctx.message?.from?.first_name || 'друже'}!

Это бот для управления файлами и их анализа.

📝 Доступные команды:
/add - добавить новый файл
/files - показать список файлов
/analyze - анализировать файлы
/clear - очистить хранилище

💡 Или просто загрузи файл прямо здесь!
    `;
    await ctx.reply(message);
    this.logger.log(`User ${ctx.from?.id} started bot`);
  }

  /**
   * /add - Запрос на добавление файла
   */
  private async handleAdd(ctx: Context) {
    const message = `
📤 Отправь мне файл для загрузки.

Поддерживаемые форматы:
✅ PDF, DOCX, TXT
✅ JPG, PNG
✅ XLS, XLSX
    `;
    await ctx.reply(message);
    this.logger.log(`User ${ctx.from?.id} requested /add`);
  }

  /**
   * /files - Список загруженных файлов
   */
  private async handleFiles(ctx: Context) {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await ctx.reply('📁 Нет загруженных файлов');
        return;
      }

      const files = fs.readdirSync(this.uploadDir);

      if (files.length === 0) {
        await ctx.reply('📁 Хранилище пусто');
        return;
      }

      let message = `📋 Загруженные файлы (${files.length}):\n\n`;
      files.forEach((file, index) => {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        message += `${index + 1}. ${file} (${sizeKB} KB)\n`;
      });

      await ctx.reply(message);
      this.logger.log(`User ${ctx.from?.id} requested /files`);
    } catch (error) {
      this.logger.error('Error in /files:', error);
      await ctx.reply('❌ Ошибка при получении списка файлов');
    }
  }

  /**
   * /analyze - Анализировать файлы
   */
  private async handleAnalyze(ctx: Context) {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await ctx.reply('❌ Нет файлов для анализа');
        return;
      }

      const files = fs.readdirSync(this.uploadDir);

      if (files.length === 0) {
        await ctx.reply('❌ Нет файлов для анализа');
        return;
      }

      await ctx.reply(`⏳ Анализирую ${files.length} файл(ов)...`);

      // Симуляция анализа
      const results = files.map((file, index) => {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          status: 'processed',
          confidence: (Math.random() * 100).toFixed(0),
        };
      });

      let message = `✅ Анализ завершён:\n\n`;
      results.forEach((result, index) => {
        message += `${index + 1}. ${result.name}\n`;
        message += `   Размер: ${(result.size / 1024).toFixed(2)} KB\n`;
        message += `   Уверенность: ${result.confidence}%\n\n`;
      });

      await ctx.reply(message);
      this.logger.log(`User ${ctx.from?.id} requested /analyze`);
    } catch (error) {
      this.logger.error('Error in /analyze:', error);
      await ctx.reply('❌ Ошибка при анализе файлов');
    }
  }

  /**
   * /clear - Очистить хранилище
   */
  private async handleClear(ctx: Context) {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await ctx.reply('✅ Хранилище уже пусто');
        return;
      }

      const files = fs.readdirSync(this.uploadDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(this.uploadDir, file));
      });

      await ctx.reply(`✅ Удалено ${files.length} файл(ов). Хранилище очищено.`);
      this.logger.log(`User ${ctx.from?.id} requested /clear`);
    } catch (error) {
      this.logger.error('Error in /clear:', error);
      await ctx.reply('❌ Ошибка при очистке хранилища');
    }
  }

  /**
   * Обработка загруженных файлов
   */
  private async handleDocument(ctx: Context) {
    try {
      const document = ctx.message?.document;
      if (!document) {
        await ctx.reply('❌ Документ не найден');
        return;
      }

      const fileName = document.file_name || `file_${Date.now()}`;
      const fileId = document.file_id;

      // Создать папку если её нет
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      // В реальном приложении здесь нужна загрузка файла
      // Для демо просто создадим пустой файл
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, `Placeholder for ${fileName}`);

      await ctx.reply(
        `✅ Файл "${fileName}" успешно загружен!\n\nИспользуй /analyze для анализа или /files для просмотра всех файлов`,
      );
      this.logger.log(`User ${ctx.from?.id} uploaded file: ${fileName}`);
    } catch (error) {
      this.logger.error('Error handling document:', error);
      await ctx.reply('❌ Ошибка при загрузке файла');
    }
  }

  /**
   * Запустить бот
   */
  async start() {
    try {
      await this.bot.launch();
      this.logger.log('🤖 Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Остановить бот
   */
  async stop() {
    await this.bot.stop();
    this.logger.log('🤖 Telegram bot stopped');
  }
}
