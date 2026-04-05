import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from '@javirs/validators';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { Request, Response } from 'express';

const COOKIE_NAME = 'linhiq_refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = registerSchema.parse(body);
    const { user, accessToken, refreshToken } = await this.auth.register(input);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const input = loginSchema.parse(body);
    const { user, accessToken, refreshToken } = await this.auth.login(input);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies[COOKIE_NAME];
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }
    const tokens = await this.auth.refreshTokens(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    return this.auth.getProfile(req.user.sub);
  }
}
