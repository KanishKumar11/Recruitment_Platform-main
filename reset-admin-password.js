// Reset admin password to a known value
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userCollection = mongoose.connection.db.collection('users');

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update admin user password
    const result = await userCollection.updateOne(
      { email: 'admin@test.com', role: 'ADMIN' },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log('📧 Email: admin@test.com');
      console.log('🔑 Password: admin123');
      console.log('\n🎯 Now you can login with these credentials');
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();