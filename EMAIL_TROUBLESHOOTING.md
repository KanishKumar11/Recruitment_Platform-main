# Email System Troubleshooting Guide

This guide helps diagnose and fix email notification issues in the recruitment platform.

## Quick Diagnostics

### 1. Run Diagnostic Script
```bash
# Comprehensive system check
node email-diagnostics.js

# Test email sending
node email-diagnostics.js your-email@example.com
```

### 2. Check Admin Dashboard
Visit `/admin/email-diagnostics` in your application to view:
- Email configuration status
- Background processor status
- Recent notification history
- Failed email statistics

## Common Issues and Solutions

### Issue 1: No Emails Being Sent

**Symptoms:**
- No emails received by recruiters
- Background processor shows jobs but no emails sent

**Diagnosis:**
```bash
# Check environment variables
node -e "console.log('ZOHO_EMAIL:', !!process.env.ZOHO_EMAIL); console.log('ZOHO_APP_PASSWORD:', !!process.env.ZOHO_APP_PASSWORD);"

# Test SMTP connection
node test-smtp.js
```

**Solutions:**
1. **Missing Environment Variables:**
   - Add `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` to your deployment config
   - Restart the application after adding variables

2. **Invalid SMTP Credentials:**
   - Verify credentials in ZeptoMail dashboard
   - Regenerate app password if needed

3. **Network Issues:**
   - Check if port 587 is accessible
   - Verify firewall settings

### Issue 2: End-of-Day Emails Not Sending

**Symptoms:**
- Usage limit emails work, but EOD emails don't send
- No cron job logs

**Diagnosis:**
```bash
# Check if cron jobs are set up
crontab -l | grep recruitment-platform

# Check cron logs
tail -f /var/log/recruitment-platform-eod.log
```

**Solutions:**
1. **Missing Cron Jobs:**
   ```bash
   chmod +x cron-setup.sh
   sudo ./cron-setup.sh
   ```

2. **Cron Job Permissions:**
   ```bash
   # Ensure log files exist and are writable
   sudo touch /var/log/recruitment-platform-eod.log
   sudo chmod 644 /var/log/recruitment-platform-eod.log
   ```

3. **Application URL Issues:**
   - Verify the URL in cron job is correct
   - Check if application is accessible from server

### Issue 3: Background Processor Not Running

**Symptoms:**
- Jobs queued but never processed
- Processor status shows "not processing"

**Diagnosis:**
```bash
# Check application logs
docker logs <container-name> | grep "background"

# Check processor status via API
curl -X GET "https://yourdomain.com/api/notifications/email?action=status"
```

**Solutions:**
1. **Restart Application:**
   ```bash
   # Docker Compose
   docker-compose restart

   # Coolify - redeploy through UI
   ```

2. **Check Initialization:**
   - Verify `initializeServices.ts` is imported in `layout.tsx`
   - Check for JavaScript errors in server logs

### Issue 4: Emails Stuck in Pending Status

**Symptoms:**
- EmailNotification records show "pending" status
- No error messages in logs

**Diagnosis:**
```bash
# Check pending notifications
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const EmailNotification = mongoose.model('EmailNotification', new mongoose.Schema({}, {strict: false}));
  const pending = await EmailNotification.find({status: 'pending'}).limit(5);
  console.log('Pending notifications:', pending);
  process.exit(0);
});
"
```

**Solutions:**
1. **Force Process Jobs:**
   ```bash
   curl -X POST "https://yourdomain.com/api/notifications/email" \
     -H "Content-Type: application/json" \
     -d '{"action":"process_now"}'
   ```

2. **Clear Stuck Jobs:**
   - Reset pending jobs older than 1 hour
   - Check for circular dependencies in job processing

## Monitoring and Maintenance

### Log Files to Monitor
```bash
# Application logs
docker logs <container-name> --tail 100 -f

# Cron job logs
tail -f /var/log/recruitment-platform-*.log

# System logs
journalctl -u cron -f
```

### Regular Health Checks
1. **Daily:** Check email statistics in admin dashboard
2. **Weekly:** Run diagnostic script
3. **Monthly:** Review and clean up old notification records

### Performance Optimization
1. **Clean up old notifications:**
   ```javascript
   // Remove notifications older than 30 days
   await EmailNotification.deleteMany({
     createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
   });
   ```

2. **Monitor queue size:**
   - Keep queue size under 100 jobs
   - Increase processing frequency if needed

## Emergency Procedures

### Complete Email System Reset
```bash
# 1. Stop application
docker-compose down

# 2. Clear all pending jobs (optional)
# Connect to MongoDB and run:
# db.emailnotifications.updateMany({status: "pending"}, {$set: {status: "failed"}})

# 3. Restart application
docker-compose up -d

# 4. Test email functionality
node email-diagnostics.js test@example.com
```

### Backup Email Configuration
```bash
# Export current email settings
curl -X GET "https://yourdomain.com/api/admin/email-settings" > email-settings-backup.json
```

## Getting Help

If issues persist:
1. Check application logs for specific error messages
2. Run the diagnostic script with verbose output
3. Review the email notification database records
4. Contact system administrator with diagnostic results

## Useful Commands Reference

```bash
# Test SMTP connection
node test-smtp.js

# Run diagnostics
node email-diagnostics.js your-email@example.com

# Check cron jobs
crontab -l

# View logs
tail -f /var/log/recruitment-platform-*.log

# Force process jobs
curl -X POST "https://yourdomain.com/api/notifications/email" -d '{"action":"process_now"}'

# Check email settings
curl -X GET "https://yourdomain.com/api/admin/email-settings"
```
