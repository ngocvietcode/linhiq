#!/bin/bash
# ══════════════════════════════════════════════════
# LinhIQ — SSL Initial Setup (run ONCE on first deploy)
# ══════════════════════════════════════════════════
# Prerequisites:
#   - DNS A records pointing to this VPS
#   - Port 80 open
# Usage: bash deploy/ssl-init.sh your-domain.com
# ══════════════════════════════════════════════════

set -euo pipefail

DOMAIN=${1:?Usage: bash ssl-init.sh your-domain.com}
EMAIL=${2:-admin@$DOMAIN}

echo "═══════════════════════════════════════"
echo "🔒 SSL Setup for $DOMAIN"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/.."

# ── Step 1: Replace domain in nginx config ──
echo "📝 Updating nginx config with domain: $DOMAIN"
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" deploy/nginx/conf.d/default.conf

# ── Step 2: Create dirs ──
mkdir -p deploy/certbot/conf deploy/certbot/www

# ── Step 3: Start nginx with HTTP-only config (for initial cert) ──
echo "🌐 Starting temporary nginx for ACME challenge..."

# Create temp HTTP-only config for initial cert
cat > deploy/nginx/conf.d/temp-http.conf << TEMPCONF
server {
    listen 80;
    server_name $DOMAIN api.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'LinhIQ: Waiting for SSL setup...';
        add_header Content-Type text/plain;
    }
}
TEMPCONF

# Temporarily rename the main config
mv deploy/nginx/conf.d/default.conf deploy/nginx/conf.d/default.conf.bak

# Start nginx with temp config
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d nginx

sleep 5

# ── Step 4: Get SSL certificate ──
echo "🔑 Requesting SSL certificate..."
docker compose -f docker-compose.prod.yml --env-file .env.prod run -T --rm certbot certonly \
  --non-interactive \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "api.$DOMAIN"

# ── Step 5: Restore full config ──
echo "📋 Restoring full nginx config..."
rm deploy/nginx/conf.d/temp-http.conf
mv deploy/nginx/conf.d/default.conf.bak deploy/nginx/conf.d/default.conf

# ── Step 6: Restart with SSL ──
echo "♻️ Restarting nginx with SSL..."
docker compose -f docker-compose.prod.yml --env-file .env.prod restart NGINX

echo ""
echo "═══════════════════════════════════════"
echo "✅ SSL Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "  Web:  https://$DOMAIN"
echo "  API:  https://api.$DOMAIN/api"
echo ""
echo "  Auto-renewal is handled by the certbot container."
echo ""
