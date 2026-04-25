import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RegisterInput, LoginInput } from '@linhiq/validators';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get a required secret from environment, throw if missing.
   */
  private getSecret(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`FATAL: ${name} environment variable is not configured`);
    }
    return value;
  }

  async register(input: RegisterInput) {
    const existing = await this.db.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role || 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(input: LoginInput) {
    const user = await this.db.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log in or register via Google OAuth profile.
   * - If user exists with googleId: log in.
   * - If user exists with matching email (no googleId): link googleId to account.
   * - Otherwise: create new user with no passwordHash.
   */
  async googleOAuthLogin(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }) {
    let user = await this.db.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      const existingByEmail = await this.db.user.findUnique({
        where: { email: profile.email },
      });

      if (existingByEmail) {
        user = await this.db.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
          },
        });
      } else {
        user = await this.db.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: profile.googleId,
            avatarUrl: profile.avatarUrl,
            role: 'STUDENT',
          },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const secret = this.getSecret('JWT_REFRESH_SECRET');
      const payload = jwt.verify(refreshToken, secret) as { sub: string };
      
      const user = await this.db.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw e; // Re-throw config errors
    }
  }

  async getProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.getSecret('JWT_SECRET');
      const payload = jwt.verify(token, secret) as JwtPayload;
      return payload;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw e;
    }
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    const secret = this.getSecret('JWT_SECRET');
    return jwt.sign(
      { sub: userId, email, role },
      secret,
      { expiresIn: '15m' },
    );
  }

  private generateRefreshToken(userId: string): string {
    const secret = this.getSecret('JWT_REFRESH_SECRET');
    return jwt.sign(
      { sub: userId },
      secret,
      { expiresIn: '7d' },
    );
  }
}
