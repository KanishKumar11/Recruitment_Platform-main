// Direct test of email service
const fs = require('fs');
const nodemailer = require('nodemailer');

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key.trim()] = value;
  }
});

console.log('Environment variables:');
console.log('ZOHO_EMAIL:', envVars.ZOHO_EMAIL);
console.log('ZOHO_APP_PASSWORD:', envVars.ZOHO_APP_PASSWORD ? 'SET' : 'NOT SET');

// Create transporter for Zoho Mail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: envVars.ZOHO_EMAIL, // Your Zoho email
      pass: envVars.ZOHO_APP_PASSWORD, // Your Zoho app password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

async function testDirectEmail() {
  try {
    console.log('\n🧪 Testing direct email sending...');

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'SourcingScreen Support Test',
        address: envVars.ZOHO_EMAIL,
      },
      to: 'hey@kanishkumar.in',
      subject: '🧪 Direct Email Test - Support System',
      html: `
        <h2>Direct Email Test</h2>
        <p>This is a direct test of the email service to verify SMTP configuration.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${envVars.ZOHO_EMAIL}</p>
      `,
      text: `
        Direct Email Test
        
        This is a direct test of the email service to verify SMTP configuration.
        Timestamp: ${new Date().toISOString()}
        From: ${envVars.ZOHO_EMAIL}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Direct email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Direct email failed:', error.message);
    return false;
  }
}

testDirectEmail();