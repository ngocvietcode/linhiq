#!/bin/bash
# ============================================================
# LinhIQ — Database Initialization Script (Production)
# ============================================================
# Chạy script này MỘT LẦN khi deploy lần đầu hoặc restore DB.
#
# Usage (from project root):
#   chmod +x deploy/db-init.sh
#   ./deploy/db-init.sh          # migrate only
#   ./deploy/db-init.sh --seed   # migrate + seed admin/subjects
#
# Hoặc chạy từ trong container api:
#   docker exec linhiq-api sh deploy/db-init.sh --seed
# ============================================================

set -euo pipefail

SEED=false
for arg in "$@"; do
  case $arg in
    --seed) SEED=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  LinhIQ — Database Initialization        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Run baseline migration ────────────────────────
echo "📦 Step 1/2 — Applying baseline migration..."
npx prisma migrate deploy \
  --schema=./packages/database/prisma/schema.prisma

echo "✅ Migration complete."
echo ""

# ── Step 2 (optional): Seed ───────────────────────────────
if [ "$SEED" = true ]; then
  echo "🌱 Step 2/2 — Seeding database (admin user + subjects)..."
  npx tsx packages/database/prisma/seed.ts
  echo "✅ Seed complete."
  echo ""
  echo "📋 Default credentials:"
  echo "   Email:    admin@linhiq.com"
  echo "   Password: Admin@123"
  echo "   ⚠️  Change password immediately after first login!"
else
  echo "⏭️  Step 2/2 — Skipping seed (pass --seed to enable)."
fi

echo ""
echo "🎉 Database initialization done!"
