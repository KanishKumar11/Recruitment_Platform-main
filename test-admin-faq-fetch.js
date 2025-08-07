// Test the admin FAQ fetch endpoint
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = 'secret';
const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function testAdminFAQFetch() {
  try {
    // Get admin user and create token
    await mongoose.connect(MONGODB_URI);
    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    const token = jwt.sign({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    }, JWT_SECRET, { expiresIn: '7d' });

    console.log('🔑 Testing admin FAQ fetch...');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test the endpoint
    const response = await fetch('http://localhost:3000/api/faqs?admin=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! FAQ count:', data.faqs.length);
    } else {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminFAQFetch();