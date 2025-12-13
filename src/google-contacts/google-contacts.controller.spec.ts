import { Test, TestingModule } from '@nestjs/testing';
import { GoogleContactsController } from './google-contacts.controller';
import { GoogleContactsService } from './google-contacts.service';

describe('GoogleContactsController', () => {
  let controller: GoogleContactsController;
  let service: GoogleContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleContactsController],
      providers: [
        {
          provide: GoogleContactsService,
          useValue: {
            syncContacts: jest.fn(),
            getSyncStatus: jest.fn(),
            getConflicts: jest.fn(),
            resolveConflict: jest.fn(),
            disconnect: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GoogleContactsController>(GoogleContactsController);
    service = module.get<GoogleContactsService>(GoogleContactsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sync', () => {
    it('should call service.syncContacts with correct parameters', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const mockSyncDto = {
        contacts: [
          {
            googleContactId: 'google123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            modifiedAt: new Date().toISOString(),
          },
        ],
        syncToken: 'token123',
        isFullSync: true,
      };

      const mockResult = { created: 1, updated: 0, merged: 0, conflicts: 0, errors: 0 };
      jest.spyOn(service, 'syncContacts').mockResolvedValue(mockResult);

      const result = await controller.sync(mockRequest as any, mockSyncDto);

      expect(service.syncContacts).toHaveBeenCalledWith('user123', mockSyncDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStatus', () => {
    it('should call service.getSyncStatus', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const mockStatus = {
        enabled: true,
        lastSyncAt: new Date(),
        totalContactsSynced: 50,
        conflicts: 2,
      };

      jest.spyOn(service, 'getSyncStatus').mockResolvedValue(mockStatus);

      const result = await controller.getStatus(mockRequest as any);

      expect(service.getSyncStatus).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockStatus);
    });
  });
});

