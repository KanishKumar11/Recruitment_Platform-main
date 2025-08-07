// Check what admin users exist in the database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function checkAdminUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if users collection exists
    const userCollection = mongoose.connection.db.collection('users');
    const userCount = await userCollection.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    // Find admin users
    const adminUsers = await userCollection.find({ role: 'ADMIN' }).toArray();
    console.log(`Admin users found: ${adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log('Admin users:');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    } else {
      console.log('No admin users found. Let\'s create one...');

      // Create an admin user
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = {
        name: 'Admin User',
        email: 'admin@sourcingscreen.com',
        password: hashedPassword,
        phone: '+1234567890',
        role: 'ADMIN',
        isPrimary: true,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await userCollection.insertOne(adminUser);
      console.log('Admin user created:', result.insertedId);
      console.log('Login credentials: admin@sourcingscreen.com / admin123');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminUsers();