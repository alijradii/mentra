#!/bin/bash

# Restart script for Mentra app

echo "🔄 Restarting Mentra applications..."

pm2 restart ecosystem.config.cjs
pm2 save

echo "✅ Applications restarted!"
echo ""
echo "📊 View status: pm2 status"
echo "📋 View logs: pm2 logs"
