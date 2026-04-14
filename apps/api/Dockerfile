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

ENV NODE_ENV=production

EXPOSE 4500

# Run migrations then start relative to the api directory
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./packages/database/prisma/schema.prisma && node apps/api/dist/main.js"]
