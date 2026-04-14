import { AuthService } from './auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: any;

  // Set required env vars for tests
  const TEST_JWT_SECRET = 'test-jwt-secret-for-unit-tests';
  const TEST_JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-unit-tests';

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_JWT_REFRESH_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new AuthService(mockDb);
  });

  // ── Register ──

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'STUDENT' as const,
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('throws ConflictException if email already exists', async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test',
          role: 'STUDENT' as const,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── Login ──

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 12);
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'STUDENT',
        passwordHash: hash,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('password123', 12);
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hash,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nobody@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── Token Generation ──

  describe('token generation', () => {
    it('generates a valid access token with correct claims', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'STUDENT',
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
        role: 'STUDENT' as const,
      });

      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;
      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('STUDENT');
    });

    it('access token expires in 15 minutes', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'STUDENT',
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
        role: 'STUDENT' as const,
      });

      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;
      const expiresInSeconds = decoded.exp - decoded.iat;
      expect(expiresInSeconds).toBe(15 * 60); // 15 minutes
    });
  });

  // ── Refresh Flow ──

  describe('refreshTokens', () => {
    it('issues new tokens for valid refresh token', async () => {
      const refreshToken = jwt.sign({ sub: 'user-1' }, TEST_JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'STUDENT',
        isActive: true,
      });

      const result = await service.refreshTokens(refreshToken);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('throws UnauthorizedException for expired refresh token', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-1' },
        TEST_JWT_REFRESH_SECRET,
        { expiresIn: '0s' },
      );

      // Wait a tiny bit for token to expire
      await new Promise((r) => setTimeout(r, 50));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for inactive user', async () => {
      const refreshToken = jwt.sign({ sub: 'user-1' }, TEST_JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });

      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      });

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── validateToken ──

  describe('validateToken', () => {
    it('returns payload for valid token', async () => {
      const token = jwt.sign(
        { sub: 'user-1', email: 'test@example.com', role: 'STUDENT' },
        TEST_JWT_SECRET,
        { expiresIn: '15m' },
      );

      const payload = await service.validateToken(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('test@example.com');
    });

    it('throws UnauthorizedException for tampered token', async () => {
      const token = jwt.sign(
        { sub: 'user-1', email: 'test@example.com', role: 'STUDENT' },
        'wrong-secret',
        { expiresIn: '15m' },
      );

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── Missing secrets ──

  describe('missing JWT secrets', () => {
    it('throws if JWT_SECRET is not set', async () => {
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'STUDENT',
        createdAt: new Date(),
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test',
          role: 'STUDENT' as const,
        }),
      ).rejects.toThrow('FATAL: JWT_SECRET');

      process.env.JWT_SECRET = savedSecret;
    });
  });
});
