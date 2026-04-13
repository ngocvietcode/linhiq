#!/bin/bash
# ══════════════════════════════════════════════════
# Javirs — VPS Initial Setup Script
# ══════════════════════════════════════════════════
# Run as root on a fresh Ubuntu 24.04 Contabo VPS:
#   curl -sSL <url> | bash
# ══════════════════════════════════════════════════

set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/home/$DEPLOY_USER/javirs"

echo "═══════════════════════════════════════"
echo "🔧 Javirs VPS Initial Setup"
echo "═══════════════════════════════════════"

# ── Step 1: System update ──
echo "📦 Updating system..."
apt update && apt upgrade -y
apt install -y \
  curl git ufw fail2ban \
  ca-certificates gnupg lsb-release

# ── Step 2: Create deploy user ──
echo "👤 Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" $DEPLOY_USER
  usermod -aG sudo $DEPLOY_USER
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$DEPLOY_USER

  # Copy SSH keys
  mkdir -p /home/$DEPLOY_USER/.ssh
  cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
  chmod 700 /home/$DEPLOY_USER/.ssh
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
fi

# ── Step 3: Firewall ──
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Step 4: Fail2ban ──
echo "🛡️ Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = 22
logpath  = /var/log/auth.log
maxretry = 3
FAIL2BAN
systemctl enable fail2ban
systemctl restart fail2ban

# ── Step 5: SSH hardening ──
echo "🔐 Hardening SSH..."
sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# ── Step 6: Install Docker ──
echo "🐳 Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $DEPLOY_USER
fi

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# ── Step 7: Create directories ──
echo "📁 Creating app directories..."
su - $DEPLOY_USER -c "
  mkdir -p ~/javirs ~/logs ~/backups/db ~/scripts
"

# ── Step 8: Backup cron ──
echo "📅 Setting up backup cron..."
cat > /home/$DEPLOY_USER/scripts/backup-db.sh << 'BACKUP'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups/db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump from Docker container
docker exec javirs-postgres pg_dump -U javirs javirs | gzip > "$BACKUP_DIR/javirs-$TIMESTAMP.sql.gz"

# Remove old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup complete: javirs-$TIMESTAMP.sql.gz ($(du -h "$BACKUP_DIR/javirs-$TIMESTAMP.sql.gz" | cut -f1))"
BACKUP

chmod +x /home/$DEPLOY_USER/scripts/backup-db.sh
chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/scripts/backup-db.sh

# Add cron (3:00 AM daily)
(crontab -u $DEPLOY_USER -l 2>/dev/null; echo "0 3 * * * /home/$DEPLOY_USER/scripts/backup-db.sh >> /home/$DEPLOY_USER/logs/backup.log 2>&1") | crontab -u $DEPLOY_USER -

# ── Step 9: Log rotation ──
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/javirs << 'LOGROTATE'
/home/deploy/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deploy deploy
}
LOGROTATE

echo ""
echo "═══════════════════════════════════════"
echo "✅ VPS Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. SSH as deploy user:  ssh deploy@$(hostname -I | awk '{print $1}')"
echo "  2. Clone your repo:    git clone <your-repo> ~/javirs"
echo "  3. Copy .env.prod:     cp .env.prod.example .env.prod"
echo "  4. Edit .env.prod:     nano .env.prod"
echo "  5. Initial SSL setup:  cd ~/javirs && bash deploy/ssl-init.sh"
echo "  6. Start services:     docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
echo ""
echo "⚠️  Root login has been DISABLED. Use 'deploy' user from now on."
echo ""
