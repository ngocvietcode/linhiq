import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from '@linhiq/validators';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { Request, Response } from 'express';
import type { GoogleProfile } from './google.strategy';

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

  /**
   * Kick off Google OAuth flow. Passport redirects the browser to Google.
   */
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  googleAuth() {
    // Passport handles the redirect; this method body is never executed.
  }

  /**
   * Google OAuth callback. Creates/links user, sets refresh cookie,
   * and redirects to the web app with the access token in the URL.
   */
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // FRONTEND_URL is required — falling back silently to localhost would
    // bounce production users to their own machine after OAuth.
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: FRONTEND_URL environment variable is not configured');
      }
      // dev fallback only
      return this.googleCallbackWithUrl(req, res, 'http://localhost:3000');
    }
    return this.googleCallbackWithUrl(req, res, frontendUrl);
  }

  private async googleCallbackWithUrl(req: Request, res: Response, frontendUrl: string) {
    const profile = req.user as GoogleProfile | undefined;

    if (!profile) {
      return res.redirect(`${frontendUrl}/login?error=google_oauth_failed`);
    }

    try {
      const { accessToken, refreshToken } = await this.auth.googleOAuthLogin(profile);
      this.setRefreshCookie(res, refreshToken);
      return res.redirect(
        `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(accessToken)}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }
}
