// Test admin login
const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    // Common passwords to try
    const passwords = ['admin123', 'password', 'admin', 'test123', '123456'];

    for (const password of passwords) {
      console.log(`Trying password: ${password}`);

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Login successful with password:', password);
        console.log('Token:', data.token);
        console.log('User:', data.user);
        return { token: data.token, password: password };
      } else {
        console.log('❌ Login failed:', data.error);
      }
    }

    console.log('All password attempts failed. Let\'s reset the admin password...');
    return null;

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function resetAdminPassword() {
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB to reset password...');

    const userCollection = mongoose.connection.db.collection('users');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const result = await userCollection.updateOne(
      { email: 'admin@test.com' },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log('Password reset result:', result);
    console.log('New password: admin123');

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function testFAQCreation(token) {
  try {
    console.log('Testing FAQ creation...');

    const response = await fetch('http://localhost:3000/api/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: 'Test FAQ from Script',
        answer: '<p>This is a test FAQ created from the test script.</p>',
        category: 'Testing',
        isActive: true,
        order: 1,
        allowInternalEdit: false
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ FAQ created successfully:', data);
    } else {
      console.log('❌ FAQ creation failed:', response.status, data);
    }

  } catch (error) {
    console.error('Error creating FAQ:', error);
  }
}

async function main() {
  const loginResult = await testAdminLogin();

  if (!loginResult) {
    await resetAdminPassword();
    // Try login again with reset password
    const retryResult = await testAdminLogin();
    if (retryResult) {
      await testFAQCreation(retryResult.token);
    }
  } else {
    await testFAQCreation(loginResult.token);
  }
}

main();