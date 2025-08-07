const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'hey@kanishkumar.in', // Admin email for testing
  testUserEmail: 'test@example.com', // Test user email
  adminToken: null, // Will be set after login
  userToken: null, // Will be set after user login
};

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test functions
async function testEmailConfiguration() {
  console.log('\n🔧 Testing Email Configuration...');
  console.log('=====================================');

  // Test email configuration validation
  const validation = await makeRequest(
    'GET',
    '/admin/support/settings/test-email',
    null,
    TEST_CONFIG.adminToken
  );

  if (validation.success) {
    console.log('✅ Email configuration validation:', validation.data);
    if (!validation.data.isValid) {
      console.log('⚠️ Configuration issues found:');
      validation.data.issues.forEach(issue => console.log(`   - ${issue}`));
    }
  } else {
    console.log('❌ Failed to validate email configuration:', validation.error);
  }

  return validation.success && validation.data.isValid;
}

async function testSendTestEmail() {
  console.log('\n📧 Testing Test Email Sending...');
  console.log('==================================');

  const testResult = await makeRequest(
    'POST',
    '/admin/support/settings/test-email',
    { testEmail: TEST_CONFIG.adminEmail },
    TEST_CONFIG.adminToken
  );

  if (testResult.success) {
    console.log('✅ Test email sent successfully:', testResult.data);
    console.log(`📬 Check your email at ${TEST_CONFIG.adminEmail}`);
  } else {
    console.log('❌ Failed to send test email:', testResult.error);
  }

  return testResult.success;
}

async function testNewTicketEmailNotification() {
  console.log('\n🎫 Testing New Ticket Email Notification...');
  console.log('=============================================');

  // Create a test ticket
  const ticketData = {
    subject: 'Test Email Notification - New Ticket',
    message: 'This is a test ticket to verify that email notifications are working correctly for new ticket submissions.',
    category: 'Technical Issue',
    priority: 'High',
  };

  const createResult = await makeRequest(
    'POST',
    '/support/tickets',
    ticketData,
    TEST_CONFIG.userToken
  );

  if (createResult.success) {
    console.log('✅ Test ticket created successfully:', {
      ticketNumber: createResult.data.ticket.ticketNumber,
      subject: createResult.data.ticket.subject,
    });
    console.log('📧 New ticket email notification should be sent to admin');
    console.log(`📬 Check admin email at ${TEST_CONFIG.adminEmail}`);
    return createResult.data.ticket;
  } else {
    console.log('❌ Failed to create test ticket:', createResult.error);
    return null;
  }
}

async function testTicketResponseEmailNotification(ticket) {
  if (!ticket) {
    console.log('⚠️ Skipping response email test - no ticket available');
    return false;
  }

  console.log('\n💬 Testing Ticket Response Email Notification...');
  console.log('=================================================');

  // Add a response to the ticket with email notification
  const responseData = {
    message: 'Thank you for your ticket. We have received your request and are working on it. This is a test response to verify email notifications.',
    isInternal: false,
    notifyUser: true, // This should trigger email notification
  };

  const responseResult = await makeRequest(
    'POST',
    `/support/tickets/${ticket._id}/responses`,
    responseData,
    TEST_CONFIG.adminToken
  );

  if (responseResult.success) {
    console.log('✅ Test response added successfully:', {
      ticketNumber: responseResult.data.ticketInfo.ticketNumber,
      responseId: responseResult.data.response._id,
    });
    console.log('📧 Response email notification should be sent to user');
    console.log(`📬 Check user email (if configured)`);
    return true;
  } else {
    console.log('❌ Failed to add test response:', responseResult.error);
    return false;
  }
}

async function testSupportSettings() {
  console.log('\n⚙️ Testing Support Settings...');
  console.log('===============================');

  // Get current settings
  const getResult = await makeRequest(
    'GET',
    '/admin/support/settings',
    null,
    TEST_CONFIG.adminToken
  );

  if (getResult.success) {
    console.log('✅ Current support settings:', getResult.data.settings);

    // Test updating settings
    const updateData = {
      settings: {
        support_email: TEST_CONFIG.adminEmail,
        support_notification_enabled: true,
        support_auto_response: true,
      },
    };

    const updateResult = await makeRequest(
      'PUT',
      '/admin/support/settings',
      updateData,
      TEST_CONFIG.adminToken
    );

    if (updateResult.success) {
      console.log('✅ Support settings updated successfully');
      console.log('Updated settings:', updateResult.data.updated);
    } else {
      console.log('❌ Failed to update support settings:', updateResult.error);
    }

    return updateResult.success;
  } else {
    console.log('❌ Failed to get support settings:', getResult.error);
    return false;
  }
}

async function loginAsAdmin() {
  console.log('\n🔐 Logging in as Admin...');
  console.log('=========================');

  const loginResult = await makeRequest('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'admin123',
  });

  if (loginResult.success) {
    TEST_CONFIG.adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', loginResult.error);
    return false;
  }
}

async function loginAsUser() {
  console.log('\n👤 Logging in as User...');
  console.log('========================');

  // Try to login with a test user - you may need to create one first
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'test123',
  });

  if (loginResult.success) {
    TEST_CONFIG.userToken = loginResult.data.token;
    console.log('✅ User login successful');
    return true;
  } else {
    console.log('❌ User login failed:', loginResult.error);
    console.log('ℹ️ You may need to create a test user first');
    // For testing purposes, we'll use admin token as user token
    TEST_CONFIG.userToken = TEST_CONFIG.adminToken;
    return true;
  }
}

// Main test execution
async function runEmailNotificationTests() {
  console.log('🚀 Starting Email Notification System Tests');
  console.log('============================================');

  try {
    // Step 1: Login as admin
    const adminLoginSuccess = await loginAsAdmin();
    if (!adminLoginSuccess) {
      console.log('❌ Cannot proceed without admin access');
      return;
    }

    // Step 2: Login as user (or fallback to admin)
    await loginAsUser();

    // Step 3: Test support settings
    const settingsSuccess = await testSupportSettings();
    if (!settingsSuccess) {
      console.log('⚠️ Settings test failed, but continuing...');
    }

    // Step 4: Test email configuration
    const configSuccess = await testEmailConfiguration();
    if (!configSuccess) {
      console.log('⚠️ Email configuration issues detected, but continuing...');
    }

    // Step 5: Test sending test email
    const testEmailSuccess = await testSendTestEmail();
    if (!testEmailSuccess) {
      console.log('⚠️ Test email failed, but continuing...');
    }

    // Step 6: Test new ticket email notification
    const testTicket = await testNewTicketEmailNotification();

    // Step 7: Test ticket response email notification
    if (testTicket) {
      await testTicketResponseEmailNotification(testTicket);
    }

    console.log('\n🎉 Email Notification Tests Completed!');
    console.log('======================================');
    console.log('📧 Check your email inbox for test notifications');
    console.log('📝 Review the console logs above for detailed results');

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Run the tests
runEmailNotificationTests();