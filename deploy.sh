#!/bin/bash

# Configuration
# Please set these variables or use an .env file
USER="your-ssh-user"
HOST="your-ssh-host"
TARGET_DIR="/var/www/noor-al-muslim"

echo "🚀 Building Noor Al Muslim..."
npm run build

echo "📤 Uploading files to $USER@$HOST:$TARGET_DIR..."
# Ensure target directory exists on server
ssh $USER@$HOST "mkdir -p $TARGET_DIR"

# Rsync files to server
rsync -avz --delete dist/ $USER@$HOST:$TARGET_DIR

echo "✅ Deployment completed successfully!"
