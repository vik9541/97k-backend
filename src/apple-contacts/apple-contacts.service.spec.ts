import { Test, TestingModule } from '@nestjs/testing';
import { AppleContactsService } from './apple-contacts.service';
import { PrismaService } from '../database/prisma.service';

describe('AppleContactsService', () => {
  let service: AppleContactsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleContactsService,
        {
          provide: PrismaService,
          useValue: {
            appleContactsSync: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            contact: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            syncConflict: {
              create: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppleContactsService>(AppleContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncContacts', () => {
    it('should create new contacts on first sync', async () => {
      const userId = 'user123';
      const mockContacts = [
        {
          appleContactId: 'apple123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Inc',
          jobTitle: 'CEO',
          notes: 'Important client',
          modifiedAt: new Date().toISOString(),
        },
      ];

      jest.spyOn(prisma.appleContactsSync, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.appleContactsSync, 'create').mockResolvedValue({
        id: BigInt(1),
        userId,
        lastSyncAt: new Date(),
        syncToken: 'token123',
        totalContactsSynced: 0,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.contact, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.contact, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.appleContactsSync, 'update').mockResolvedValue({} as any);

      const result = await service.syncContacts(userId, {
        contacts: mockContacts,
        syncToken: 'token123',
        isFullSync: true,
      });

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should detect and log conflicts', async () => {
      const userId = 'user123';
      const existingContact = {
        id: BigInt(1),
        userId: 'user123',
        appleContactId: 'apple123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        company: null,
        jobTitle: null,
        notes: null,
        appleModifiedAt: null,
        syncVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(Date.now() + 1000), // Updated after remote
      };

      jest.spyOn(prisma.appleContactsSync, 'findUnique').mockResolvedValue({
        id: BigInt(1),
        userId,
        lastSyncAt: new Date(),
        syncToken: 'token123',
        totalContactsSynced: 0,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.contact, 'findFirst').mockResolvedValue(existingContact as any);
      jest.spyOn(prisma.syncConflict, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.appleContactsSync, 'update').mockResolvedValue({} as any);

      const result = await service.syncContacts(userId, {
        contacts: [
          {
            appleContactId: 'apple123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            modifiedAt: new Date(Date.now() - 1000).toISOString(),
          },
        ],
        syncToken: 'token123',
        isFullSync: false,
      });

      expect(result.conflicts).toBe(1);
      expect(prisma.syncConflict.create).toHaveBeenCalled();
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status for connected user', async () => {
      const userId = 'user123';
      const mockSync = {
        id: BigInt(1),
        userId,
        enabled: true,
        lastSyncAt: new Date(),
        totalContactsSynced: 50,
        syncToken: 'token123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.appleContactsSync, 'findUnique').mockResolvedValue(mockSync as any);
      jest.spyOn(prisma.syncConflict, 'count').mockResolvedValue(2);

      const status = await service.getSyncStatus(userId);

      expect(status.enabled).toBe(true);
      expect(status.totalContactsSynced).toBe(50);
      expect(status.conflicts).toBe(2);
    });

    it('should return default status for non-connected user', async () => {
      const userId = 'user456';

      jest.spyOn(prisma.appleContactsSync, 'findUnique').mockResolvedValue(null);

      const status = await service.getSyncStatus(userId);

      expect(status.enabled).toBe(false);
      expect(status.lastSyncAt).toBeNull();
      expect(status.totalContactsSynced).toBe(0);
      expect(status.conflicts).toBe(0);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local_wins strategy', async () => {
      const conflictId = 1;
      const mockConflict = {
        id: BigInt(conflictId),
        contactId: BigInt(42),
        userId: 'user123',
        conflictType: 'update',
        localData: { email: 'local@example.com' },
        remoteData: { email: 'remote@example.com' },
        resolved: false,
        resolutionStrategy: null,
        createdAt: new Date(),
        resolvedAt: null,
      };

      jest.spyOn(prisma.syncConflict, 'findUnique').mockResolvedValue(mockConflict as any);
      jest.spyOn(prisma.contact, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.syncConflict, 'update').mockResolvedValue({} as any);

      const result = await service.resolveConflict(conflictId, 'local_wins');

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('local_wins');
      expect(prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockConflict.contactId },
          data: mockConflict.localData,
        }),
      );
    });
  });
});
