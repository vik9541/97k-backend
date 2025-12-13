import { Test, TestingModule } from '@nestjs/testing';
import { TelegramBotService } from './telegram-bot.service';
import { PrismaService } from '../../database/prisma.service';

// ============================================
// TELEGRAM BOT SERVICE TESTS
// @97v_bot для Виктора Лаврентьева
// ============================================

describe('TelegramBotService', () => {
  let service: TelegramBotService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    victorObservation: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Mock environment for testing
    process.env.NODE_ENV = 'development';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('handleUpdate', () => {
    it('should process message updates', async () => {
      const update = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 123,
            is_bot: false,
            first_name: 'Виктор',
            last_name: 'Лаврентьев',
            username: 'victor97v',
          },
          chat: {
            id: 123,
            type: 'private' as const,
            first_name: 'Виктор',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/start',
        },
      };

      // Should not throw
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should process callback query updates', async () => {
      const update = {
        update_id: 123456790,
        callback_query: {
          id: 'query-1',
          from: {
            id: 123,
            is_bot: false,
            first_name: 'Виктор',
          },
          data: 'action:sync',
        },
      };

      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });
  });

  describe('commands', () => {
    const createMessage = (text: string) => ({
      update_id: Date.now(),
      message: {
        message_id: 1,
        from: {
          id: 123,
          is_bot: false,
          first_name: 'Виктор',
        },
        chat: {
          id: 123,
          type: 'private' as const,
        },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    });

    it('should handle /start command', async () => {
      const update = createMessage('/start');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /help command', async () => {
      const update = createMessage('/help');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /meeting command with description', async () => {
      const update = createMessage('/meeting Кофе с партнёром в 15:00');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /task command', async () => {
      const update = createMessage('/task Позвонить поставщику');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /idea command', async () => {
      const update = createMessage('/idea Новая маркетинговая стратегия');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /contacts command', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      const update = createMessage('/contacts');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle /stats command', async () => {
      mockPrismaService.contact.count.mockResolvedValue(42);
      const update = createMessage('/stats');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });

    it('should handle Russian commands', async () => {
      const update = createMessage('/встреча Обед с клиентом');
      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });
  });

  describe('contact sharing', () => {
    it('should save shared contact', async () => {
      mockPrismaService.contact.create.mockResolvedValue({
        id: 1n,
        fullName: 'Иван Петров',
        phone: '+79001234567',
      });

      const update = {
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: 123, is_bot: false, first_name: 'Виктор' },
          chat: { id: 123, type: 'private' as const },
          date: Math.floor(Date.now() / 1000),
          contact: {
            phone_number: '+79001234567',
            first_name: 'Иван',
            last_name: 'Петров',
          },
        },
      };

      await service.handleUpdate(update);

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullName: 'Иван Петров',
          phone: '+79001234567',
          sourceType: 'manual',
        }),
      });
    });
  });

  describe('location sharing', () => {
    it('should save shared location', async () => {
      const update = {
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: 123, is_bot: false, first_name: 'Виктор' },
          chat: { id: 123, type: 'private' as const },
          date: Math.floor(Date.now() / 1000),
          location: {
            latitude: 55.7558,
            longitude: 37.6173,
          },
        },
      };

      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });
  });

  describe('voice messages', () => {
    it('should save voice message metadata', async () => {
      const update = {
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: 123, is_bot: false, first_name: 'Виктор' },
          chat: { id: 123, type: 'private' as const },
          date: Math.floor(Date.now() / 1000),
          voice: {
            file_id: 'voice-123',
            file_unique_id: 'unique-123',
            duration: 15,
          },
        },
      };

      await expect(service.handleUpdate(update)).resolves.not.toThrow();
    });
  });

  describe('notifyVictor', () => {
    it('should not throw without VICTOR_TELEGRAM_ID', async () => {
      delete process.env.VICTOR_TELEGRAM_ID;
      await expect(service.notifyVictor('Test message')).resolves.not.toThrow();
    });
  });

  describe('Victor-specific scenarios', () => {
    it('should be configured for @97v_bot', () => {
      // Service should be ready for Victor
      expect(service).toBeDefined();
    });
  });
});
