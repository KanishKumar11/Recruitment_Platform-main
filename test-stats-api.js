const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

console.log('🔍 Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');

async function testStatsAPI() {
  try {
    console.log('🧪 Testing Support Stats API');
    console.log('============================');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get an admin user to create a valid token
    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('❌ No admin user found. Creating one...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const newAdmin = {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await userCollection.insertOne(newAdmin);
      adminUser = { ...newAdmin, _id: result.insertedId };
      console.log('✅ Created admin user');
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        userId: adminUser._id.toString(),
        role: adminUser.role // Keep the role as-is (ADMIN)
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Created JWT token for admin user');
    console.log('🔍 Admin user role:', adminUser.role);
    console.log('🔍 Token payload:', jwt.decode(token));

    // Test the stats API
    const response = await fetch('http://localhost:3001/api/support/tickets/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Stats API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorData);
    }

  } catch (error) {
    console.error('❌ Error testing stats API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testStatsAPI();