#!/bin/bash

# View logs for Mentra applications

# If argument provided, show logs for specific app
if [ -n "$1" ]; then
    pm2 logs "mentra-$1" --lines 100
else
    # Show logs for all apps
    pm2 logs --lines 100
fi
