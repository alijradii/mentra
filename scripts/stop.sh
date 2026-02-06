#!/bin/bash

# Stop script for Mentra app

echo "⏸️  Stopping Mentra applications..."

pm2 stop ecosystem.config.cjs
pm2 save

echo "✅ Applications stopped!"
