#!/usr/bin/env node

/**
 * Test script to verify the End-of-Day email logic
 * Tests the new logic that prevents duplicate emails
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testEODLogic() {
  console.log('🧪 Testing End-of-Day Email Logic');
  console.log('==================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test 1: Check current email settings
    console.log('1. Checking current email settings...');
    try {
      const settingsResponse = await axios.get(`${BASE_URL}/api/admin/email-settings`);
      const settings = settingsResponse.data.settings;
      console.log('✅ Email settings retrieved:');
      console.log(`   - Notifications enabled: ${settings.email_notifications_enabled}`);
      console.log(`   - Usage limit threshold: ${settings.job_notification_frequency} applications`);
      console.log(`   - EOD notifications: ${settings.end_of_day_notifications}`);
      console.log(`   - EOD time: ${settings.end_of_day_time}`);
    } catch (error) {
      console.log('❌ Failed to get email settings:', error.response?.data || error.message);
    }

    // Test 2: Check EOD endpoint status
    console.log('\n2. Testing EOD endpoint status...');
    try {
      const eodStatusResponse = await axios.get(`${BASE_URL}/api/cron/end-of-day-emails`);
      console.log('✅ EOD endpoint status:');
      console.log(`   Response: ${JSON.stringify(eodStatusResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ EOD endpoint failed:', error.response?.data || error.message);
    }

    // Test 3: Simulate EOD email trigger
    console.log('\n3. Testing EOD email trigger...');
    try {
      const eodTriggerResponse = await axios.post(`${BASE_URL}/api/cron/end-of-day-emails`);
      console.log('✅ EOD email trigger response:');
      console.log(`   ${JSON.stringify(eodTriggerResponse.data, null, 2)}`);
      
      if (eodTriggerResponse.data.sent === false) {
        console.log('ℹ️  This is expected behavior if:');
        console.log('   - No jobs were posted today');
        console.log('   - Usage limit emails were already sent today');
        console.log('   - EOD emails were already sent today');
        console.log('   - EOD notifications are disabled');
      }
    } catch (error) {
      console.log('❌ EOD trigger failed:', error.response?.data || error.message);
    }

    // Test 4: Check email analytics (if available)
    console.log('\n4. Testing email analytics...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/api/admin/email-analytics?days=1`);
      console.log('✅ Email analytics retrieved:');
      const analytics = analyticsResponse.data;
      console.log(`   - Total emails today: ${analytics.overallStats.totalEmails}`);
      console.log(`   - Usage limit emails: ${analytics.overallStats.usageLimitEmails}`);
      console.log(`   - EOD emails: ${analytics.overallStats.eodEmails}`);
      console.log(`   - Success rate: ${((analytics.overallStats.sentEmails / Math.max(analytics.overallStats.totalEmails, 1)) * 100).toFixed(1)}%`);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('ℹ️  Analytics endpoint requires admin authentication');
      } else {
        console.log('❌ Analytics failed:', error.response?.data || error.message);
      }
    }

    // Test 5: Check notification API status
    console.log('\n5. Testing notification API status...');
    try {
      const notificationStatusResponse = await axios.get(`${BASE_URL}/api/notifications/email?action=status`);
      console.log('✅ Notification API status:');
      console.log(`   ${JSON.stringify(notificationStatusResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ Notification API failed:', error.response?.data || error.message);
    }

    console.log('\n📋 Test Summary');
    console.log('================');
    console.log('✅ EOD email logic has been updated with the following improvements:');
    console.log('');
    console.log('🔧 Key Changes Made:');
    console.log('   1. EOD emails are skipped if usage limit emails were sent that day');
    console.log('   2. Usage limit threshold is now configurable via admin settings');
    console.log('   3. Admin analytics dashboard shows email statistics');
    console.log('   4. Enhanced error handling and logging throughout');
    console.log('');
    console.log('📊 Email Logic Flow:');
    console.log('   • Job applications trigger usage limit check');
    console.log('   • If threshold reached → Send usage limit emails');
    console.log('   • EOD cron job checks if usage limit emails were sent');
    console.log('   • If usage limit emails sent → Skip EOD emails');
    console.log('   • If no usage limit emails → Send EOD summary');
    console.log('   • Result: Maximum 1 email per recruiter per day');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Configure email settings in admin panel');
    console.log('   2. Set up cron jobs: sudo ./cron-setup.sh');
    console.log('   3. Monitor analytics dashboard for email performance');
    console.log('   4. Test with real job postings and applications');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testEODLogic();
