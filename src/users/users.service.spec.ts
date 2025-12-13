import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database';
import { UpdateUserDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'CUSTOMER_B2C' as const,
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    companyName: null,
    inn: null,
    kpp: null,
    creditLimit: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          role: true,
        }),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+9876543210',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto, password: 'hashedpassword' };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateDto,
        select: expect.any(Object),
      });
    });

    it('should update B2B user company details', async () => {
      const b2bUpdateDto: UpdateUserDto = {
        companyName: 'New Company',
        kpp: '123456789',
      };

      const updatedUser = { ...mockUser, ...b2bUpdateDto, password: 'hashedpassword' };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('user-1', b2bUpdateDto);

      expect(result.companyName).toBe('New Company');
      expect(result.kpp).toBe('123456789');
    });

    it('should handle partial updates', async () => {
      const partialDto: UpdateUserDto = {
        phone: '+1111111111',
      };

      const updatedUser = { ...mockUser, phone: '+1111111111', password: 'hashedpassword' };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.update('user-1', partialDto);

      expect(result.phone).toBe('+1111111111');
      expect(result.firstName).toBe(mockUser.firstName);
    });
  });
});
