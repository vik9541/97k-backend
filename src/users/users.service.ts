import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        inn: true,
        kpp: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        inn: true,
        kpp: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
