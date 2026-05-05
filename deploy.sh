#!/bin/bash
# Quick Deployment Script
# Usage: ./deploy.sh username@host.com /path/to/webroot

REMOTE_USER=$1
REMOTE_PATH=$2
LOCAL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dist"

if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_PATH" ]; then
    echo "Usage: ./deploy.sh username@host.com /var/www/html/nr-realty"
    exit 1
fi

echo "🚀 Deploying NR Realty website..."
echo "Source: $LOCAL_PATH"
echo "Target: $REMOTE_USER:$REMOTE_PATH"
echo ""

# Build production version first
echo "📦 Building production version..."
python3 build.py || { echo "Build failed!"; exit 1; }

# Deploy using rsync (faster than scp for updates)
echo "📤 Uploading files..."
rsync -avz --delete "$LOCAL_PATH/" "$REMOTE_USER:$REMOTE_PATH/" || { echo "Upload failed!"; exit 1; }

# Set correct permissions
echo "🔐 Setting file permissions..."
ssh "$REMOTE_USER" "chmod -R 755 $REMOTE_PATH && chmod 644 $REMOTE_PATH/.htaccess"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your website is now live at:"
echo "  https://yourdomain.com"
echo ""
echo "Tips:"
echo "  - Clear CDN cache if using one"
echo "  - Test on different devices"
echo "  - Monitor server logs for errors"
echo "  - Check Google Search Console"
