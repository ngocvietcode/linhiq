# ═══════════════════════════════════════════
# Javirs Web — Production Dockerfile
# Multi-stage build for Next.js (standalone)
# ═══════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# Copy full repository for isolated correct build
COPY . .

# Install all dependencies precisely preserving pnpm symlinks
RUN pnpm install --frozen-lockfile

# Build Next.js
RUN cd apps/web && pnpm build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
