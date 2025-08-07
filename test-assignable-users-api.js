const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function testAssignableUsersAPI() {
  try {
    console.log('🧪 Testing Assignable Users API');
    console.log('=================================');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get an admin user to create a valid token
    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        userId: adminUser._id.toString(),
        role: adminUser.role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Created JWT token for admin user');

    // Test the assignable users API
    const response = await fetch('http://localhost:3001/api/support/tickets/assignable-users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignable Users API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorData);
    }

  } catch (error) {
    console.error('❌ Error testing assignable users API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAssignableUsersAPI();