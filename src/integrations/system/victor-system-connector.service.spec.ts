import { Test, TestingModule } from '@nestjs/testing';
import { VictorSystemConnector } from './victor-system-connector.service';
import { PrismaService } from '../../database/prisma.service';
import { AppleAuthService } from '../apple/apple-auth.service';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// ============================================
// VICTOR SYSTEM CONNECTOR TESTS
// Центральный хаб для info@97v.ru
// ============================================

describe('VictorSystemConnector', () => {
  let service: VictorSystemConnector;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    appleContactsSync: {
      findUnique: jest.fn(),
    },
    contact: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAppleAuthService = {
    generateAuthUrl: jest.fn(),
    validateToken: jest.fn(),
    revokeAccess: jest.fn(),
  };

  const mockTelegramBotService = {
    notifyVictor: jest.fn(),
    setWebhook: jest.fn(),
  };

  const mockEventEmitter = {
    on: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VictorSystemConnector,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AppleAuthService, useValue: mockAppleAuthService },
        { provide: TelegramBotService, useValue: mockTelegramBotService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<VictorSystemConnector>(VictorSystemConnector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getSystemStatus', () => {
    it('should return complete system status', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'victor-id',
        email: 'info@97v.ru',
      });
      mockPrismaService.appleContactsSync.findUnique.mockResolvedValue({
        enabled: true,
        lastSyncAt: new Date(),
      });
      mockPrismaService.contact.count.mockResolvedValue(150);

      const status = await service.getSystemStatus();

      expect(status).toHaveProperty('apple');
      expect(status).toHaveProperty('telegram');
      expect(status).toHaveProperty('database');
      expect(status.database.contactsCount).toBe(150);
    });

    it('should handle missing Victor user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.contact.count.mockResolvedValue(0);

      const status = await service.getSystemStatus();

      expect(status.apple.connected).toBe(false);
    });

    it('should check telegram bot token status', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.contact.count.mockResolvedValue(0);
      
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      
      const status = await service.getSystemStatus();
      
      expect(status.telegram.connected).toBe(true);
      expect(status.telegram.botUsername).toBe('@97v_bot');
    });
  });

  describe('connectApple', () => {
    it('should generate Apple auth URL for user', async () => {
      const userId = 'victor-123';
      mockAppleAuthService.generateAuthUrl.mockReturnValue('https://appleid.apple.com/auth/authorize?...');

      const result = await service.connectApple(userId);

      expect(result).toHaveProperty('authUrl');
      expect(mockAppleAuthService.generateAuthUrl).toHaveBeenCalled();
    });
  });

  describe('disconnectApple', () => {
    it('should revoke Apple access and notify', async () => {
      const userId = 'victor-123';

      await service.disconnectApple(userId);

      expect(mockAppleAuthService.revokeAccess).toHaveBeenCalledWith(userId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'apple.disconnected',
        expect.objectContaining({ userId })
      );
      expect(mockTelegramBotService.notifyVictor).toHaveBeenCalled();
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary for Victor', async () => {
      mockPrismaService.contact.count.mockResolvedValue(50);

      const summary = await service.getDailySummary();

      expect(summary).toHaveProperty('date');
      expect(summary).toHaveProperty('contacts');
      expect(summary).toHaveProperty('observations');
      expect(summary).toHaveProperty('meetings');
      expect(summary).toHaveProperty('tasks');
      expect(summary.contacts.total).toBe(50);
    });
  });

  describe('exportVictorData', () => {
    it('should export data as JSON', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { id: 1, name: 'Иван', email: 'ivan@test.ru', phone: '+7900', company: 'Test', createdAt: new Date() },
      ]);

      const result = await service.exportVictorData('json');

      expect(result.filename).toMatch(/victor_export_\d+\.json/);
      expect(result.mimeType).toBe('application/json');
      expect(JSON.parse(result.data)).toHaveProperty('owner');
      expect(JSON.parse(result.data).owner.email).toBe('info@97v.ru');
    });

    it('should export data as CSV', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { id: 1, name: 'Иван', email: 'ivan@test.ru', phone: '+7900', company: 'Test', createdAt: new Date() },
      ]);

      const result = await service.exportVictorData('csv');

      expect(result.filename).toMatch(/victor_export_\d+\.csv/);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('id,fullName,email,phone,company');
    });
  });

  describe('initializeFullSync', () => {
    it('should sync all systems and notify Victor', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'victor-id',
        email: 'info@97v.ru',
      });
      mockAppleAuthService.validateToken.mockResolvedValue(true);
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';

      const result = await service.initializeFullSync();

      expect(result.success).toBe(true);
      expect(result.results).toHaveProperty('apple');
      expect(result.results).toHaveProperty('telegram');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sync.completed',
        expect.any(Object)
      );
      expect(mockTelegramBotService.notifyVictor).toHaveBeenCalled();
    });
  });

  describe('notifyVictor', () => {
    it('should send notification via Telegram', async () => {
      const message = 'Test notification';

      await service.notifyVictor(message);

      expect(mockTelegramBotService.notifyVictor).toHaveBeenCalledWith(message);
    });
  });

  describe('Victor-specific configuration', () => {
    it('should be configured for info@97v.ru', () => {
      expect(service).toBeDefined();
      // Service should be ready for Victor as PRIMARY_ADMIN
    });
  });
});
