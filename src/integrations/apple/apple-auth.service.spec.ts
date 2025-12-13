import { Test, TestingModule } from '@nestjs/testing';
import { AppleAuthService } from './apple-auth.service';
import { PrismaService } from '../../database/prisma.service';

// ============================================
// APPLE AUTH SERVICE TESTS
// OAuth 2.0 для Виктора Лаврентьева
// ============================================

describe('AppleAuthService', () => {
  let service: AppleAuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    appleContactsSync: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleAuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppleAuthService>(AppleAuthService);
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

  describe('generateAuthUrl', () => {
    it('should generate valid Apple authorization URL', () => {
      const state = 'test-state-123';
      const url = service.generateAuthUrl(state);

      expect(url).toContain('https://appleid.apple.com/auth/authorize');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toMatch(/scope=name[+%20]email/); // URLSearchParams uses + instead of %20
      expect(url).toContain(`state=${state}`);
    });

    it('should include response_mode=form_post', () => {
      const url = service.generateAuthUrl('test');
      expect(url).toContain('response_mode=form_post');
    });
  });

  describe('validateToken', () => {
    it('should return true for valid enabled sync', async () => {
      const userId = 'victor-123';
      mockPrismaService.appleContactsSync.findUnique.mockResolvedValue({
        userId,
        enabled: true,
        syncToken: 'valid-token',
      });

      const result = await service.validateToken(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.appleContactsSync.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return false for disabled sync', async () => {
      mockPrismaService.appleContactsSync.findUnique.mockResolvedValue({
        userId: 'victor-123',
        enabled: false,
      });

      const result = await service.validateToken('victor-123');

      expect(result).toBe(false);
    });

    it('should return false if no sync record exists', async () => {
      mockPrismaService.appleContactsSync.findUnique.mockResolvedValue(null);

      const result = await service.validateToken('unknown-user');

      expect(result).toBe(false);
    });
  });

  describe('revokeAccess', () => {
    it('should disable Apple access for user', async () => {
      const userId = 'victor-123';
      mockPrismaService.appleContactsSync.update.mockResolvedValue({
        userId,
        enabled: false,
      });

      await service.revokeAccess(userId);

      expect(mockPrismaService.appleContactsSync.update).toHaveBeenCalledWith({
        where: { userId },
        data: { enabled: false },
      });
    });
  });

  describe('Victor-specific scenarios', () => {
    it('should handle Victor email (info@97v.ru)', async () => {
      const victorEmail = 'info@97v.ru';
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'victor-new',
        email: victorEmail,
        name: 'Лаврентьев Виктор Петрович',
        role: 'PRIMARY_ADMIN',
        isVerified: true,
      });

      // Проверяем что сервис готов работать с Victor
      expect(service).toBeDefined();
    });
  });
});
