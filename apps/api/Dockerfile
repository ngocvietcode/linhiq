# ═══════════════════════════════════════════
# Javirs API — Production Dockerfile
# Multi-stage build for NestJS
# ═══════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# Copy full repository for isolated correct build
COPY . .

# Install all dependencies precisely preserving pnpm symlinks
RUN pnpm install --frozen-lockfile

# Generate Prisma client locally
RUN ./node_modules/.bin/prisma generate --schema=./packages/database/prisma/schema.prisma

# Build NestJS
RUN cd apps/api && pnpm build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production

# Copy built output and production deps
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 4500

# Run migrations then start
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
