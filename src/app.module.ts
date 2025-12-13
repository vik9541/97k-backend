import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { GdprModule } from './gdpr/gdpr.module';
import { GmailModule } from './integrations/gmail/gmail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppleContactsModule } from './apple-contacts/apple-contacts.module';
import { GoogleContactsModule } from './google-contacts/google-contacts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    GdprModule,
    GmailModule,
    AnalyticsModule,
    AppleContactsModule,
    GoogleContactsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
