import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RegisterInput, LoginInput } from '@javirs/validators';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

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
      const secret = process.env.JWT_REFRESH_SECRET || 'javirs-dev-refresh-secret';
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
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
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

  async validateToken(token: string) {
    try {
      const secret = process.env.JWT_SECRET || 'javirs-dev-secret';
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        role: string;
      };
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    const secret = process.env.JWT_SECRET || 'javirs-dev-secret';
    return jwt.sign(
      { sub: userId, email, role },
      secret,
      { expiresIn: '15m' },
    );
  }

  private generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'javirs-dev-refresh-secret';
    return jwt.sign(
      { sub: userId },
      secret,
      { expiresIn: '7d' },
    );
  }
}
