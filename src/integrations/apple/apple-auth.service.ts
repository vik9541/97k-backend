import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

// ============================================
// APPLE SIGN-IN SERVICE
// OAuth 2.0 интеграция для Лаврентьева В.П.
// ============================================

export interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string; // Apple User ID
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  real_user_status?: number;
}

export interface AppleAuthResult {
  userId: string;
  appleUserId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);
  
  // Apple конфигурация
  private readonly APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'ru.97v.contacts';
  private readonly APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
  private readonly APPLE_KEY_ID = process.env.APPLE_KEY_ID || '';
  private readonly APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || '';
  private readonly APPLE_REDIRECT_URI = process.env.APPLE_REDIRECT_URI || 'https://api.97v.ru/api/apple/callback';
  
  // Victor конфигурация
  private readonly VICTOR_EMAIL = 'info@97v.ru';

  constructor(private prisma: PrismaService) {}

  /**
   * Генерация URL для Apple Sign-In
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.APPLE_CLIENT_ID,
      redirect_uri: this.APPLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post',
      state: state,
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  /**
   * Обработка callback от Apple
   */
  async handleCallback(
    code: string,
    state: string,
    user?: { name?: { firstName?: string; lastName?: string }; email?: string },
  ): Promise<AppleAuthResult> {
    this.logger.log(`[APPLE] Processing callback, state: ${state}`);

    // Обмен code на tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    // Декодируем id_token
    const payload = this.decodeIdToken(tokens.id_token);
    
    // Ищем или создаём пользователя
    const victorUser = await this.findOrCreateVictor(payload, user);

    // Сохраняем Apple credentials
    await this.saveAppleCredentials(victorUser.id, {
      appleUserId: payload.sub,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    this.logger.log(`[APPLE] Auth complete for Victor: ${victorUser.email}`);

    return {
      userId: victorUser.id,
      appleUserId: payload.sub,
      email: victorUser.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };
  }

  /**
   * Обмен authorization code на токены
   */
  private async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    id_token: string;
  }> {
    const clientSecret = this.generateClientSecret();

    const params = new URLSearchParams({
      client_id: this.APPLE_CLIENT_ID,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.APPLE_REDIRECT_URI,
    });

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`[APPLE] Token exchange failed: ${error}`);
      throw new UnauthorizedException('Apple token exchange failed');
    }

    return response.json();
  }

  /**
   * Генерация client_secret JWT для Apple
   */
  private generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: this.APPLE_TEAM_ID,
      iat: now,
      exp: now + 86400 * 180, // 180 days
      aud: 'https://appleid.apple.com',
      sub: this.APPLE_CLIENT_ID,
    };

    // В production используем реальный private key
    if (this.APPLE_PRIVATE_KEY) {
      return jwt.sign(payload, this.APPLE_PRIVATE_KEY, {
        algorithm: 'ES256',
        keyid: this.APPLE_KEY_ID,
      });
    }

    // Для разработки возвращаем mock
    this.logger.warn('[APPLE] Using mock client_secret (dev mode)');
    return 'mock_client_secret_for_development';
  }

  /**
   * Декодирование id_token от Apple
   */
  private decodeIdToken(idToken: string): AppleTokenPayload {
    // В production нужно верифицировать подпись через Apple public keys
    const decoded = jwt.decode(idToken) as AppleTokenPayload;
    
    if (!decoded) {
      throw new UnauthorizedException('Invalid Apple id_token');
    }

    return decoded;
  }

  /**
   * Поиск или создание пользователя Victor
   */
  private async findOrCreateVictor(
    payload: AppleTokenPayload,
    userInfo?: { name?: { firstName?: string; lastName?: string }; email?: string },
  ) {
    // Сначала ищем по Apple User ID
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { appleUserId: payload.sub },
          { email: payload.email || this.VICTOR_EMAIL },
        ],
      },
    });

    if (!user) {
      // Создаём Виктора с временным паролем (Apple Sign-In не требует пароля)
      const tempPassword = crypto.randomBytes(32).toString('hex');
      user = await this.prisma.user.create({
        data: {
          email: payload.email || this.VICTOR_EMAIL,
          password: tempPassword, // Не используется для Apple Sign-In
          name: userInfo?.name 
            ? `${userInfo.name.firstName || ''} ${userInfo.name.lastName || ''}`.trim()
            : 'Лаврентьев Виктор Петрович',
          appleUserId: payload.sub,
          role: 'PRIMARY_ADMIN',
          isVerified: true,
        },
      });
      this.logger.log(`[APPLE] Created Victor user: ${user.id}`);
    } else if (!user.appleUserId) {
      // Обновляем существующего пользователя
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { appleUserId: payload.sub },
      });
      this.logger.log(`[APPLE] Linked Apple ID to Victor: ${user.id}`);
    }

    return user;
  }

  /**
   * Сохранение Apple credentials
   */
  private async saveAppleCredentials(
    userId: string,
    credentials: {
      appleUserId: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt: Date;
    },
  ) {
    await this.prisma.appleContactsSync.upsert({
      where: { userId },
      create: {
        userId,
        syncToken: credentials.accessToken,
        enabled: true,
        lastSyncAt: new Date(),
      },
      update: {
        syncToken: credentials.accessToken,
        enabled: true,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Проверка валидности токена
   */
  async validateToken(userId: string): Promise<boolean> {
    const sync = await this.prisma.appleContactsSync.findUnique({
      where: { userId },
    });

    if (!sync || !sync.enabled) {
      return false;
    }

    // Здесь можно добавить проверку expiration
    return true;
  }

  /**
   * Отзыв доступа Apple
   */
  async revokeAccess(userId: string): Promise<void> {
    await this.prisma.appleContactsSync.update({
      where: { userId },
      data: { enabled: false },
    });

    this.logger.log(`[APPLE] Revoked access for user: ${userId}`);
  }
}
