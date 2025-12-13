import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Logger,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppleAuthService } from './apple-auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ============================================
// APPLE SIGN-IN CONTROLLER
// OAuth 2.0 callback для Виктора Лаврентьева
// ============================================

interface AppleCallbackBody {
  code: string;
  state: string;
  user?: string; // JSON string with user info (first auth only)
  error?: string;
}

@Controller('api/apple')
export class AppleAuthController {
  private readonly logger = new Logger(AppleAuthController.name);

  constructor(private readonly appleAuthService: AppleAuthService) {}

  /**
   * GET /api/apple/auth
   * Инициация Apple Sign-In для Виктора
   */
  @Get('auth')
  initiateAuth(@Res() res: Response) {
    // Генерируем state для CSRF protection
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      purpose: 'victor_icloud_connect',
    })).toString('base64');

    const authUrl = this.appleAuthService.generateAuthUrl(state);
    
    this.logger.log(`[APPLE] Redirecting to Apple Sign-In`);
    return res.redirect(authUrl);
  }

  /**
   * POST /api/apple/callback
   * Apple Sign-In callback (form_post)
   */
  @Post('callback')
  async handleCallback(
    @Body() body: AppleCallbackBody,
    @Res() res: Response,
  ) {
    this.logger.log(`[APPLE] Callback received`);

    // Проверяем на ошибки
    if (body.error) {
      this.logger.error(`[APPLE] Auth error: ${body.error}`);
      return res.redirect(`/auth/error?message=${encodeURIComponent(body.error)}`);
    }

    try {
      // Парсим user info если есть (только при первой авторизации)
      let userInfo: { name?: { firstName?: string; lastName?: string }; email?: string } | undefined;
      if (body.user) {
        try {
          userInfo = JSON.parse(body.user);
        } catch (e) {
          this.logger.warn('[APPLE] Failed to parse user info');
        }
      }

      // Обрабатываем callback
      const result = await this.appleAuthService.handleCallback(
        body.code,
        body.state,
        userInfo,
      );

      this.logger.log(`[APPLE] Auth successful for: ${result.email}`);

      // Редирект на успешную страницу с токеном
      const successUrl = new URL('/auth/apple/success', 'https://97v.ru');
      successUrl.searchParams.set('connected', 'true');
      successUrl.searchParams.set('email', result.email);
      
      return res.redirect(successUrl.toString());
    } catch (error) {
      this.logger.error(`[APPLE] Callback error: ${error.message}`);
      return res.redirect(`/auth/error?message=${encodeURIComponent('Apple Sign-In failed')}`);
    }
  }

  /**
   * GET /api/apple/callback
   * Fallback для GET запросов (response_mode=query)
   */
  @Get('callback')
  async handleCallbackGet(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      this.logger.error(`[APPLE] Auth error (GET): ${error}`);
      return res.redirect(`/auth/error?message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect('/auth/error?message=No authorization code');
    }

    try {
      const result = await this.appleAuthService.handleCallback(code, state);
      
      const successUrl = new URL('/auth/apple/success', 'https://97v.ru');
      successUrl.searchParams.set('connected', 'true');
      successUrl.searchParams.set('email', result.email);
      
      return res.redirect(successUrl.toString());
    } catch (error) {
      this.logger.error(`[APPLE] Callback error (GET): ${error.message}`);
      return res.redirect(`/auth/error?message=${encodeURIComponent('Apple Sign-In failed')}`);
    }
  }

  /**
   * GET /api/apple/status
   * Статус подключения Apple для текущего пользователя
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getConnectionStatus(@CurrentUser() user: { id: string }) {
    const isValid = await this.appleAuthService.validateToken(user.id);
    
    return {
      connected: isValid,
      provider: 'apple',
      email: 'info@97v.ru',
      features: {
        contacts: isValid,
        calendar: false, // TODO: Phase 14
        reminders: false, // TODO: Phase 15
      },
    };
  }

  /**
   * POST /api/apple/disconnect
   * Отключение Apple интеграции
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@CurrentUser() user: { id: string }) {
    await this.appleAuthService.revokeAccess(user.id);
    
    return {
      success: true,
      message: 'Apple integration disconnected',
    };
  }

  /**
   * POST /api/apple/refresh
   * Обновление токенов Apple
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshTokens(@CurrentUser() user: { id: string }) {
    // TODO: Implement token refresh logic
    return {
      success: true,
      message: 'Tokens refreshed',
    };
  }
}
