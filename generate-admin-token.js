// Generate a fresh admin token for browser use
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';
const JWT_SECRET = 'secret';

async function generateAdminToken() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    const tokenPayload = {
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    console.log('\n🎯 ADMIN TOKEN FOR BROWSER:');
    console.log('=====================================');
    console.log(token);
    console.log('=====================================');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Open your browser and go to the admin dashboard');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Application/Storage tab');
    console.log('4. Find localStorage');
    console.log('5. Set key: "token"');
    console.log('6. Set value: (the token above)');
    console.log('7. Refresh the page');
    console.log('\n✅ You should now be able to create FAQs!');

    console.log('\n👤 Admin User Info:');
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Role:', adminUser.role);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

generateAdminToken();