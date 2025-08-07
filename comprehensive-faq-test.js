// Comprehensive FAQ test script
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';
const JWT_SECRET = 'secret'; // Same as in .env

async function comprehensiveTest() {
  try {
    // Step 1: Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 2: Check admin user
    console.log('\n👤 Checking admin user...');
    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('✅ Admin user found:', {
      id: adminUser._id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });

    // Step 3: Create a proper JWT token
    console.log('\n🔑 Creating JWT token...');
    const tokenPayload = {
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Token created:', token.substring(0, 50) + '...');

    // Step 4: Verify the token
    console.log('\n🔍 Verifying token...');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified successfully:', decoded);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return;
    }

    // Step 5: Test FAQ creation via API
    console.log('\n📝 Testing FAQ creation via API...');

    // First check if server is running
    try {
      const healthCheck = await fetch('http://localhost:3000/api/faqs');
      console.log('✅ Server is running, status:', healthCheck.status);
    } catch (error) {
      console.log('❌ Server is not running. Please start with: npm run dev');
      return;
    }

    // Test FAQ creation
    const faqData = {
      question: 'Test FAQ from Comprehensive Script',
      answer: '<p>This is a comprehensive test FAQ.</p>',
      category: 'Testing',
      isActive: true,
      order: 1,
      allowInternalEdit: false
    };

    console.log('📤 Sending FAQ creation request...');
    const response = await fetch('http://localhost:3000/api/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(faqData)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ FAQ created successfully!');
      console.log('📄 FAQ data:', responseData);
    } else {
      console.log('❌ FAQ creation failed');
      console.log('📄 Response status:', response.status);
      console.log('📄 Response data:', responseData);

      // Additional debugging
      if (response.status === 403) {
        console.log('\n🔍 Debugging 403 error...');
        console.log('- Check server logs for detailed token verification info');
        console.log('- Token payload:', tokenPayload);
        console.log('- Expected role: ADMIN');
        console.log('- Actual role:', tokenPayload.role);
      }
    }

    // Step 6: Test with admin=true parameter
    console.log('\n📋 Testing admin FAQ fetch...');
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

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Also export the token creation function for manual testing
async function createAdminToken() {
  await mongoose.connect(MONGODB_URI);
  const userCollection = mongoose.connection.db.collection('users');
  const adminUser = await userCollection.findOne({ role: 'ADMIN' });

  if (adminUser) {
    const token = jwt.sign({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    }, JWT_SECRET, { expiresIn: '7d' });

    console.log('Admin token for manual testing:');
    console.log(token);
    console.log('\nUse this in browser localStorage as "token"');
  }

  await mongoose.disconnect();
}

// Run the comprehensive test
comprehensiveTest();

// Uncomment to just create a token:
// createAdminToken();