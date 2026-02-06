#!/bin/bash

# Start script for Mentra app
# Use this to start the app without rebuilding

set -e

echo "▶️  Starting Mentra with PM2..."

pm2 start ecosystem.config.cjs
pm2 save

echo "✅ Applications started!"
echo ""
echo "📊 View status: pm2 status"
echo "📋 View logs: pm2 logs"
