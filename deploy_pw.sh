#!/bin/bash
# Deploy using password auth — ignores local SSH key entirely
set -e

USER="root"
HOST="76.13.40.119"
TARGET_DIR="/var/www/noor"
PASS="Rawad@225144"

SSH_OPTS="-o StrictHostKeyChecking=no -o IdentitiesOnly=yes -i /dev/null -o PubkeyAuthentication=no -o PasswordAuthentication=yes"

echo "🚀 Preparing deployment to $HOST"

echo "📦 Creating deployment archive (excluding heavy dirs)..."
tar -czf deployment.tar.gz \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".expo" \
  --exclude="dist" \
  --exclude="deployment.tar.gz" \
  --exclude="deploy_pw.sh" \
  --exclude="test_dua.js" \
  .

echo "📤 Uploading archive to server..."
sshpass -p "$PASS" scp $SSH_OPTS deployment.tar.gz $USER@$HOST:$TARGET_DIR/ 2>/dev/null || \
  ssh $SSH_OPTS $USER@$HOST mkdir -p $TARGET_DIR

echo "🐳 Building and deploying Docker container on server..."
sshpass -p "$PASS" ssh $SSH_OPTS $USER@$HOST \
  "cd $TARGET_DIR && tar -xzf deployment.tar.gz && rm deployment.tar.gz && docker compose build noor_app && docker compose up -d noor_app && docker image prune -f"

rm -f deployment.tar.gz
echo "✅ Deployed successfully to https://noor.zimura.digital"
