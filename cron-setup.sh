#!/bin/bash

# Cron Job Setup Script for Email Notifications
# This script sets up cron jobs for the recruitment platform email notifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Email Notification Cron Jobs${NC}"
echo "========================================"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script as root or with sudo${NC}"
    exit 1
fi

# Get the application URL from user
read -p "Enter your application URL (e.g., https://yourdomain.com): " APP_URL

if [ -z "$APP_URL" ]; then
    echo -e "${RED}Application URL is required${NC}"
    exit 1
fi

# Remove trailing slash if present
APP_URL=${APP_URL%/}

# Create cron job for end-of-day emails (runs at 6 PM daily)
EOD_CRON_JOB="0 18 * * * curl -X POST \"$APP_URL/api/cron/end-of-day-emails\" -H \"Content-Type: application/json\" >> /var/log/recruitment-platform-eod.log 2>&1"

# Create cron job for retry processing (runs every 5 minutes)
RETRY_CRON_JOB="*/5 * * * * curl -X POST \"$APP_URL/api/notifications/email\" -H \"Content-Type: application/json\" -d '{\"action\":\"process_now\"}' >> /var/log/recruitment-platform-retry.log 2>&1"

# Create log files with proper permissions
touch /var/log/recruitment-platform-eod.log
touch /var/log/recruitment-platform-retry.log
chmod 644 /var/log/recruitment-platform-eod.log
chmod 644 /var/log/recruitment-platform-retry.log

# Add cron jobs
echo "Adding cron jobs..."

# Check if cron jobs already exist
if crontab -l 2>/dev/null | grep -q "recruitment-platform-eod"; then
    echo -e "${YELLOW}End-of-day cron job already exists, updating...${NC}"
    # Remove existing job
    crontab -l 2>/dev/null | grep -v "recruitment-platform-eod" | crontab -
fi

if crontab -l 2>/dev/null | grep -q "recruitment-platform-retry"; then
    echo -e "${YELLOW}Retry cron job already exists, updating...${NC}"
    # Remove existing job
    crontab -l 2>/dev/null | grep -v "recruitment-platform-retry" | crontab -
fi

# Add new cron jobs
(crontab -l 2>/dev/null; echo "$EOD_CRON_JOB") | crontab -
(crontab -l 2>/dev/null; echo "$RETRY_CRON_JOB") | crontab -

echo -e "${GREEN}Cron jobs added successfully!${NC}"
echo ""
echo "Configured jobs:"
echo "1. End-of-day emails: Daily at 6:00 PM"
echo "2. Retry processing: Every 5 minutes"
echo ""
echo "Log files:"
echo "- End-of-day: /var/log/recruitment-platform-eod.log"
echo "- Retry processing: /var/log/recruitment-platform-retry.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To view logs: tail -f /var/log/recruitment-platform-*.log"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
