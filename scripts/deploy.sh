#!/bin/bash

# Deployment script for Mentra app
# This script builds and deploys the application using PM2

set -e  # Exit on error

echo "🚀 Starting Mentra deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Install it with: npm install -g pm2${NC}"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Install it from: https://bun.sh${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
bun install

# Build backend
echo -e "${YELLOW}🔨 Building backend...${NC}"
cd apps/backend
bun run build
cd ../..

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd apps/frontend
bun run build
cd ../..

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 processes (if any)
echo -e "${YELLOW}⏸️  Stopping existing processes...${NC}"
pm2 stop ecosystem.config.cjs 2>/dev/null || true

# Start or reload apps with PM2
echo -e "${YELLOW}▶️  Starting applications with PM2...${NC}"
pm2 start ecosystem.config.cjs

# Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs"
echo "🔄 Restart apps with: pm2 restart ecosystem.config.cjs"
