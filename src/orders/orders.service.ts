import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    // Получаем информацию о пользователе для определения цены
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Получаем продукты
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: dto.items.map((item) => item.productId),
        },
      },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Some products not found');
    }

    // Вычисляем цены (B2B или B2C)
    const isB2B = user.role === 'CUSTOMER_B2B';
    let subtotal = 0;

    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // Выбираем цену в зависимости от типа клиента
      const price = isB2B && product.priceB2B ? product.priceB2B : product.priceRetail;
      const itemTotal = Number(price) * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price,
      };
    });

    const deliveryPrice = 0; // TODO: Расчет доставки
    const totalPrice = subtotal + deliveryPrice;

    // Генерируем номер заказа
    const orderNumber = await this.generateOrderNumber();

    // Создаем заказ
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId: dto.addressId,
        subtotal,
        deliveryPrice,
        totalPrice,
        deliveryNotes: dto.deliveryNotes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: dto,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const count = await this.prisma.order.count();
    const sequence = (count + 1).toString().padStart(5, '0');

    return `ORD-${year}${month}${day}-${sequence}`;
  }
}
