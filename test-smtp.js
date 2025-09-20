const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with ZeptoMail SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.zeptomail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test email configuration
const mailOptions = {
  from: {
    name: 'SourcingScreen Test',
    address: process.env.ZOHO_EMAIL,
  },
  to: 'keenkanish@gmail.com',
  subject: 'ZeptoMail SMTP Test - Configuration Verification',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">ZeptoMail SMTP Test</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #28a745; margin-top: 0;">✅ SMTP Configuration Test Successful!</h3>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li><strong>SMTP Host:</strong> smtp.zeptomail.com</li>
          <li><strong>Port:</strong> 587</li>
          <li><strong>Security:</strong> TLS</li>
          <li><strong>From Email:</strong> ${process.env.ZOHO_EMAIL}</li>
          <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      <p>This email confirms that your ZeptoMail SMTP configuration is working correctly for the SourcingScreen recruitment platform.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This is an automated test email from SourcingScreen platform.
      </p>
    </div>
  `,
  text: `
ZeptoMail SMTP Test - Configuration Verification

✅ SMTP Configuration Test Successful!

Test Details:
- SMTP Host: smtp.zeptomail.com
- Port: 587
- Security: TLS
- From Email: ${process.env.ZOHO_EMAIL}
- Test Time: ${new Date().toLocaleString()}

This email confirms that your ZeptoMail SMTP configuration is working correctly for the SourcingScreen recruitment platform.

This is an automated test email from SourcingScreen platform.
  `,
};

// Function to test SMTP connection and send email
async function testSMTPConnection() {
  console.log('🔄 Testing ZeptoMail SMTP connection...');
  console.log('📧 Configuration:');
  console.log(`   Host: smtp.zeptomail.com`);
  console.log(`   Port: 587`);
  console.log(`   From: ${process.env.ZOHO_EMAIL}`);
  console.log(`   To: keenkanish@gmail.com`);
  console.log('');

  try {
    // Test connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Email sent to: keenkanish@gmail.com`);
    console.log('');
    console.log('🎉 ZeptoMail SMTP configuration is working correctly!');
    
  } catch (error) {
    console.error('❌ SMTP Test Failed!');
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.response) {
      console.error(`Server response: ${error.response}`);
    }
    
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check if ZOHO_EMAIL and ZOHO_APP_PASSWORD are set in .env file');
    console.log('2. Verify ZeptoMail credentials are correct');
    console.log('3. Ensure smtp.zeptomail.com is accessible from your network');
    console.log('4. Check if the sender email is authorized in ZeptoMail');
    
    process.exit(1);
  }
}

// Run the test
testSMTPConnection();