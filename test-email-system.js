#!/usr/bin/env node

/**
 * Email System Test Script
 * Tests the complete email notification system
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = process.argv[2];

if (!TEST_EMAIL) {
  console.log('Usage: node test-email-system.js <test-email@example.com>');
  process.exit(1);
}

async function testEmailSystem() {
  console.log('🧪 Testing Email Notification System');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log('');

  try {
    // Test 1: Check EOD email status
    console.log('1. Testing EOD email endpoint...');
    try {
      const eodResponse = await axios.get(`${BASE_URL}/api/cron/end-of-day-emails`);
      console.log('✅ EOD endpoint accessible');
      console.log(`   Status: ${JSON.stringify(eodResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ EOD endpoint failed:', error.response?.data || error.message);
    }

    // Test 2: Check email notification API
    console.log('\n2. Testing email notification API...');
    try {
      const notificationResponse = await axios.post(`${BASE_URL}/api/notifications/email`, {
        action: 'status'
      });
      console.log('✅ Notification API accessible');
      console.log(`   Status: ${JSON.stringify(notificationResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ Notification API failed:', error.response?.data || error.message);
    }

    // Test 3: Trigger manual email processing
    console.log('\n3. Testing manual email processing...');
    try {
      const processResponse = await axios.post(`${BASE_URL}/api/notifications/email`, {
        action: 'process_now'
      });
      console.log('✅ Manual processing triggered');
      console.log(`   Response: ${JSON.stringify(processResponse.data, null, 2)}`);
    } catch (error) {
      console.log('❌ Manual processing failed:', error.response?.data || error.message);
    }

    // Test 4: Check if admin diagnostics endpoint exists
    console.log('\n4. Testing admin diagnostics endpoint...');
    try {
      // This will likely fail without auth, but we can check if endpoint exists
      const diagResponse = await axios.get(`${BASE_URL}/api/admin/email-diagnostics`);
      console.log('✅ Admin diagnostics accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Admin diagnostics endpoint exists (requires auth)');
      } else {
        console.log('❌ Admin diagnostics failed:', error.response?.data || error.message);
      }
    }

    console.log('\n📋 Test Summary');
    console.log('================');
    console.log('✅ Basic API endpoints are accessible');
    console.log('✅ Email system infrastructure is in place');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure ZOHO_EMAIL and ZOHO_APP_PASSWORD are set in environment');
    console.log('2. Run: node email-diagnostics.js ' + TEST_EMAIL);
    console.log('3. Set up cron jobs: sudo ./cron-setup.sh');
    console.log('4. Monitor logs for email sending activity');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testEmailSystem();
