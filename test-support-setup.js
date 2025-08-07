// Simple test to verify support system setup
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function testSetup() {
  console.log('🧪 TESTING SUPPORT SYSTEM SETUP');
  console.log('===============================\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test database connection
    console.log('2️⃣ Testing database connection...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Database connection working');
    console.log(`📋 Found ${collections.length} collections\n`);

    // Test if we can create a simple document
    console.log('3️⃣ Testing basic database operations...');

    // Create a test schema
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });

    const TestModel = mongoose.model('Test', TestSchema);

    // Create and save a test document
    const testDoc = new TestModel({ name: 'Support System Test' });
    await testDoc.save();
    console.log('✅ Can create and save documents');

    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Can delete documents\n');

    console.log('🎉 SETUP TEST COMPLETE');
    console.log('======================');
    console.log('✅ Database connection working');
    console.log('✅ MongoDB operations functional');
    console.log('✅ Ready for support system implementation');

  } catch (error) {
    console.error('❌ Setup test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

testSetup();