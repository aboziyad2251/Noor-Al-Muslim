#!/bin/bash

# Configuration explicitly targeting the Zimuar.digital DNS
USER="root" # Replace with actual SSH user
HOST="76.13.40.119" # Target IP mapped to noor.zimura.digital
TARGET_DIR="/var/www/noor"

# Exit instantly if a command fails
set -e

echo "🚀 Preparing deployment to $HOST"

echo "📤 Syncing code to $USER@$HOST:$TARGET_DIR..."
# Ensure target directory exists on server
ssh $USER@$HOST "mkdir -p $TARGET_DIR"

# Zip files locally to transfer (ignoring heavy directories)
tar -czf deployment.tar.gz \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".expo" \
  --exclude="dist" \
  --exclude="deployment.tar.gz" .

# Upload securely via SCP
scp deployment.tar.gz $USER@$HOST:$TARGET_DIR/

echo "🐳 Extracting code, building and starting Docker container on server..."
ssh $USER@$HOST "cd $TARGET_DIR && tar -xzf deployment.tar.gz && rm deployment.tar.gz && docker compose build noor_app && docker compose up -d noor_app && docker image prune -f"

# Clean up local artifact
rm deployment.tar.gz

echo "✅ Docker Deployment completed successfully! Hosted at https://noor.zimura.digital"
