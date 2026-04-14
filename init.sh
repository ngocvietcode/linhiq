#!/bin/bash
set -e

echo "Updating packages and installing dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git ufw jq

echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
else
    echo "Docker already installed"
fi

echo "Configuring UFW Firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 9443
ufw allow 4000
yes | ufw enable || true

echo "Setting up deploy user..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos '' deploy
fi
usermod -aG sudo deploy
usermod -aG docker deploy

echo "Setting up SSH keys for deploy..."
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

echo "Creating deployment directories..."
mkdir -p /home/deploy/linhiq/deploy
mkdir -p /home/deploy/backups
chown -R deploy:deploy /home/deploy/linhiq
chown -R deploy:deploy /home/deploy/backups

echo "Deploying Portainer..."
if ! docker ps -a | grep -q portainer; then
    docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
else
    echo "Portainer already running"
fi

echo "Init complete!"
