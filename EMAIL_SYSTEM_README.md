# Email Notification System

This document provides a complete overview of the automated email notification system for recruiters.

## System Overview

The email notification system sends automated emails to recruiters in two scenarios:
1. **Usage Limit Notifications**: When jobs reach a configurable application threshold (default: 5 applications)
2. **End-of-Day (EOD) Notifications**: Daily summary of new jobs posted

## Architecture

### Components
- **Email Service** (`emailService.ts`): Core SMTP functionality using ZeptoMail
- **Recruiter Email Service** (`recruiterEmailService.ts`): Recruiter-specific email templates and logic
- **Job Queue** (`jobQueue.ts`): Asynchronous job processing with retry logic
- **Background Processor** (`backgroundJobProcessor.ts`): Processes queued email jobs
- **Email Notification Model**: Database tracking of sent emails

### Flow Diagram
```
Job Created → Trigger Check → Queue Email Job → Background Processor → Send Email → Update Database
     ↓              ↓              ↓                    ↓                ↓            ↓
  API Call    Usage Limit?    JobQueue.add()    Process Every 30s    SMTP Send   EmailNotification
```

## Configuration

### Environment Variables (Required)
```bash
ZOHO_EMAIL=your-zeptomail-email@yourdomain.com
ZOHO_APP_PASSWORD=your-zeptomail-app-password
MONGODB_URI=mongodb://localhost:27017/recruitment-platform
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Email Settings (Configurable via Admin Panel)
- `job_notification_frequency`: Application threshold for notifications (default: 5)
- `end_of_day_notifications`: Enable/disable EOD emails (default: true)
- `end_of_day_time`: Time to send EOD emails (default: "18:00")
- `email_notifications_enabled`: Master switch for all notifications (default: true)

## Setup Instructions

### 1. Configure Email Credentials
1. Sign up for [ZeptoMail](https://www.zoho.com/zeptomail/)
2. Verify your domain
3. Generate SMTP credentials
4. Add `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` to your environment

### 2. Update Deployment Configuration
Add email environment variables to:
- `docker-compose.yml`
- `coolify.yml`
- Your deployment platform

### 3. Set Up Cron Jobs
```bash
chmod +x cron-setup.sh
sudo ./cron-setup.sh
```

This configures:
- EOD emails: Daily at 6:00 PM
- Retry processing: Every 5 minutes

### 4. Test the System
```bash
# Test SMTP connection
node test-smtp.js

# Run comprehensive diagnostics
node email-diagnostics.js your-email@example.com

# Test API endpoints
node test-email-system.js your-email@example.com
```

## Usage

### Automatic Triggers

**Usage Limit Notifications:**
- Triggered when a job is created via `/api/jobs`
- Checks if any jobs have reached the application threshold
- Sends bulk notifications to all active recruiters

**End-of-Day Notifications:**
- Triggered by cron job calling `/api/cron/end-of-day-emails`
- Sends summary of jobs posted that day
- Only includes jobs not already covered by usage limit notifications

### Manual Triggers

**Admin Panel:**
- Visit `/admin/email-diagnostics` for system status
- Test email sending functionality
- View notification statistics

**API Endpoints:**
```bash
# Trigger bulk notifications
curl -X POST "/api/notifications/email" -d '{"action":"trigger_bulk"}'

# Process pending jobs immediately
curl -X POST "/api/notifications/email" -d '{"action":"process_now"}'

# Get processor status
curl -X GET "/api/notifications/email?action=status"
```

## Monitoring

### Log Files
```bash
# Application logs
docker logs <container-name> --tail 100 -f

# Cron job logs
tail -f /var/log/recruitment-platform-eod.log
tail -f /var/log/recruitment-platform-retry.log
```

### Admin Dashboard
Access `/admin/email-diagnostics` to view:
- Email configuration status
- Background processor status
- Recent notification history
- Failed email statistics

### Database Monitoring
```javascript
// Check notification statistics
db.emailnotifications.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Find recent failures
db.emailnotifications.find({ status: "failed" }).sort({ createdAt: -1 }).limit(10)
```

## Troubleshooting

### Common Issues

1. **No emails being sent**
   - Check environment variables are set
   - Verify SMTP credentials
   - Test connection with `node test-smtp.js`

2. **EOD emails not working**
   - Verify cron jobs are set up: `crontab -l`
   - Check cron logs: `tail -f /var/log/recruitment-platform-eod.log`
   - Test endpoint manually: `curl -X POST "/api/cron/end-of-day-emails"`

3. **Background processor not running**
   - Check application logs for initialization errors
   - Restart application: `docker-compose restart`
   - Verify `initializeServices.ts` is imported in `layout.tsx`

### Diagnostic Tools

```bash
# Comprehensive system check
node email-diagnostics.js

# Test specific email
node email-diagnostics.js your-email@example.com

# Check API endpoints
node test-email-system.js your-email@example.com
```

### Emergency Procedures

**Reset Email System:**
```bash
# Stop application
docker-compose down

# Clear pending jobs (optional)
# Connect to MongoDB: db.emailnotifications.updateMany({status: "pending"}, {$set: {status: "failed"}})

# Restart application
docker-compose up -d

# Test functionality
node email-diagnostics.js test@example.com
```

## Performance Considerations

### Queue Management
- Maximum concurrent jobs: 3
- Job retry attempts: 5 with exponential backoff
- Processing interval: Every 5 seconds
- Cleanup old jobs: Automatically after 24 hours

### Database Optimization
- Index on `{ recruiterId: 1, sentDate: 1, emailType: 1 }`
- Index on `{ emailSent: 1, nextRetryAt: 1 }`
- Regular cleanup of old notification records

### Rate Limiting
- SMTP rate limits handled by retry logic
- Exponential backoff: 5min, 15min, 30min, 1hr, 2hr

## Security

### Email Security
- Uses TLS encryption for SMTP
- App passwords instead of account passwords
- No sensitive data in email templates

### API Security
- Admin endpoints require authentication
- Role-based access control
- Rate limiting on email sending endpoints

## Maintenance

### Regular Tasks
- **Daily**: Monitor email statistics in admin dashboard
- **Weekly**: Run diagnostic script to check system health
- **Monthly**: Clean up old notification records
- **Quarterly**: Review and update email templates

### Updates and Changes
- Email templates: Update in `recruiterEmailService.ts`
- Notification frequency: Change via admin panel
- SMTP settings: Update environment variables and restart

## Support

For issues or questions:
1. Check the troubleshooting guide: `EMAIL_TROUBLESHOOTING.md`
2. Run diagnostic tools
3. Review application logs
4. Contact system administrator with diagnostic results
