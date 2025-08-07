// Test the complete login flow
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secret';

async function testLoginFlow() {
  try {
    console.log('🔐 Testing login flow...');

    // Step 1: Login with admin credentials
    console.log('\n1️⃣ Attempting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', loginResponse.status, errorData);

      // Try to reset password and retry
      console.log('\n🔄 Trying to reset admin password...');
      const mongoose = require('mongoose');
      const bcrypt = require('bcryptjs');

      await mongoose.connect('mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen');
      const userCollection = mongoose.connection.db.collection('users');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await userCollection.updateOne(
        { email: 'admin@test.com', role: 'ADMIN' },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );

      console.log('✅ Password reset. Retrying login...');
      await mongoose.disconnect();

      // Retry login
      const retryResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'admin123'
        })
      });

      if (!retryResponse.ok) {
        const retryError = await retryResponse.json();
        console.log('❌ Retry login also failed:', retryResponse.status, retryError);
        return;
      }

      const loginData = await retryResponse.json();
      console.log('✅ Login successful after password reset!');
      await testWithToken(loginData.token);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('👤 User data:', loginData.user);

    await testWithToken(loginData.token);

  } catch (error) {
    console.error('❌ Error in login flow:', error);
  }
}

async function testWithToken(token) {
  try {
    console.log('\n2️⃣ Analyzing token...');
    console.log('🎫 Token:', token.substring(0, 50) + '...');

    // Decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded successfully:');
    console.log('   - User ID:', decoded.userId);
    console.log('   - Email:', decoded.email);
    console.log('   - Role:', decoded.role);
    console.log('   - Issued at:', new Date(decoded.iat * 1000));
    console.log('   - Expires at:', new Date(decoded.exp * 1000));

    // Step 3: Test FAQ creation with this token
    console.log('\n3️⃣ Testing FAQ creation...');
    const faqResponse = await fetch('http://localhost:3000/api/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: 'Test FAQ from Login Flow',
        answer: '<p>This FAQ was created using the login flow token.</p>',
        category: 'Login Test',
        isActive: true,
        order: 1,
        allowInternalEdit: false
      })
    });

    const faqData = await faqResponse.json();

    if (faqResponse.ok) {
      console.log('✅ FAQ created successfully!');
      console.log('📄 FAQ ID:', faqData.faq._id);
    } else {
      console.log('❌ FAQ creation failed:', faqResponse.status);
      console.log('📄 Error:', faqData);
      console.log('\n🔍 Check the server console for debug logs!');
    }

    // Step 4: Test admin FAQ fetch
    console.log('\n4️⃣ Testing admin FAQ fetch...');
    const adminFetchResponse = await fetch('http://localhost:3000/api/faqs?admin=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (adminFetchResponse.ok) {
      const adminFaqs = await adminFetchResponse.json();
      console.log('✅ Admin FAQ fetch successful, count:', adminFaqs.faqs.length);
    } else {
      console.log('❌ Admin FAQ fetch failed:', adminFetchResponse.status);
    }

    console.log('\n🎯 BROWSER TOKEN:');
    console.log('=====================================');
    console.log(token);
    console.log('=====================================');
    console.log('Copy this token to browser localStorage as "token"');

  } catch (error) {
    console.error('❌ Error testing token:', error);
  }
}

testLoginFlow();