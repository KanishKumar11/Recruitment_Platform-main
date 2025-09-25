#!/usr/bin/env node

/**
 * Email Diagnostics Script
 * Comprehensive email system testing and diagnostics tool
 */

const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

async function checkEnvironmentVariables() {
  logSection('Environment Variables Check');
  
  const requiredVars = [
    'ZOHO_EMAIL',
    'ZOHO_APP_PASSWORD',
    'MONGODB_URI'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      log(`✓ ${varName}: Set`, 'green');
    } else {
      log(`✗ ${varName}: Missing`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function testSMTPConnection() {
  logSection('SMTP Connection Test');
  
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD) {
    log('✗ Cannot test SMTP - missing credentials', 'red');
    return false;
  }
  
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    log('Testing SMTP connection...', 'yellow');
    await transporter.verify();
    log('✓ SMTP connection successful', 'green');
    return true;
  } catch (error) {
    log(`✗ SMTP connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function sendTestEmail(recipientEmail) {
  logSection('Test Email Send');
  
  if (!recipientEmail) {
    log('✗ No recipient email provided', 'red');
    return false;
  }
  
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    const mailOptions = {
      from: {
        name: 'SourcingScreen Diagnostics',
        address: process.env.ZOHO_EMAIL,
      },
      to: recipientEmail,
      subject: 'Email System Diagnostic Test',
      html: `
        <h2>Email System Test</h2>
        <p>This is a test email from the SourcingScreen recruitment platform.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Timestamp: ${new Date().toISOString()}</li>
          <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
          <li>Test Type: Diagnostic</li>
        </ul>
        <p>If you received this email, the email system is working correctly.</p>
      `,
      text: `
        Email System Test
        
        This is a test email from the SourcingScreen recruitment platform.
        
        Test Details:
        - Timestamp: ${new Date().toISOString()}
        - Environment: ${process.env.NODE_ENV || 'development'}
        - Test Type: Diagnostic
        
        If you received this email, the email system is working correctly.
      `
    };
    
    log(`Sending test email to ${recipientEmail}...`, 'yellow');
    const result = await transporter.sendMail(mailOptions);
    log(`✓ Test email sent successfully (Message ID: ${result.messageId})`, 'green');
    return true;
  } catch (error) {
    log(`✗ Failed to send test email: ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabaseConnection() {
  logSection('Database Connection Test');
  
  if (!process.env.MONGODB_URI) {
    log('✗ MONGODB_URI not set', 'red');
    return false;
  }
  
  try {
    log('Connecting to MongoDB...', 'yellow');
    await mongoose.connect(process.env.MONGODB_URI);
    log('✓ Database connection successful', 'green');
    
    // Check EmailNotification collection
    const EmailNotification = mongoose.model('EmailNotification', new mongoose.Schema({}, { strict: false }));
    const count = await EmailNotification.countDocuments();
    log(`✓ Found ${count} email notification records`, 'green');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function runDiagnostics() {
  log('Email System Diagnostics Tool', 'magenta');
  log('Starting comprehensive email system check...', 'blue');
  
  const results = {
    environment: await checkEnvironmentVariables(),
    database: await checkDatabaseConnection(),
    smtp: await testSMTPConnection(),
  };
  
  // Get test email from command line argument
  const testEmail = process.argv[2];
  if (testEmail) {
    results.testEmail = await sendTestEmail(testEmail);
  } else {
    log('\nTo test email sending, run: node email-diagnostics.js your-email@example.com', 'yellow');
  }
  
  logSection('Summary');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    log('✓ All diagnostics passed! Email system is working correctly.', 'green');
  } else {
    log('✗ Some diagnostics failed. Please check the issues above.', 'red');
    
    if (!results.environment) {
      log('  → Set missing environment variables', 'yellow');
    }
    if (!results.database) {
      log('  → Check database connection and configuration', 'yellow');
    }
    if (!results.smtp) {
      log('  → Verify SMTP credentials and network connectivity', 'yellow');
    }
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
