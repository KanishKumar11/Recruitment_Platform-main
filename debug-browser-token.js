// Debug the token that's being used in the browser
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = 'secret';
const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function debugBrowserToken() {
  console.log('🔍 Token Debugging Guide');
  console.log('========================\n');

  console.log('1️⃣ GET YOUR BROWSER TOKEN:');
  console.log('   - Open browser dev tools (F12)');
  console.log('   - Go to Application/Storage → Local Storage');
  console.log('   - Find the "token" key');
  console.log('   - Copy the token value\n');

  console.log('2️⃣ PASTE YOUR TOKEN HERE:');
  console.log('   - Edit this file');
  console.log('   - Replace "YOUR_TOKEN_HERE" with your actual token');
  console.log('   - Run the script again\n');

  // PASTE YOUR BROWSER TOKEN HERE:
  const browserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhiYzBiYWE2Y2NmMTY3NTA3MmIwMGUiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0MjE1OTc4LCJleHAiOjE3NTQ4MjA3Nzh9.BDby-k_ad2in5dZEWEe0PUP7mn6ZQnDfPFr78onLNSA';

  if (browserToken === 'YOUR_TOKEN_HERE') {
    console.log('❌ Please paste your actual browser token in this script');
    console.log('   Edit line 15 and replace YOUR_TOKEN_HERE with your token');
    return;
  }

  try {
    console.log('3️⃣ ANALYZING YOUR TOKEN:');
    console.log('   Token length:', browserToken.length);
    console.log('   Token preview:', browserToken.substring(0, 50) + '...');

    // Try to decode the token
    const decoded = jwt.verify(browserToken, JWT_SECRET);
    console.log('✅ Token is valid!');
    console.log('   - User ID:', decoded.userId);
    console.log('   - Email:', decoded.email);
    console.log('   - Role:', decoded.role);
    console.log('   - Issued:', new Date(decoded.iat * 1000));
    console.log('   - Expires:', new Date(decoded.exp * 1000));

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.log('❌ TOKEN IS EXPIRED!');
      console.log('   This is why you\'re getting "Admin access required"');
      console.log('   You need to login again or use a fresh token');
    } else {
      console.log('✅ Token is not expired');
    }

    // Check role
    if (decoded.role !== 'ADMIN') {
      console.log('❌ ROLE MISMATCH!');
      console.log(`   Your role: ${decoded.role}`);
      console.log('   Required role: ADMIN');
    } else {
      console.log('✅ Role is correct (ADMIN)');
    }

    // Check if user exists in database
    await mongoose.connect(MONGODB_URI);
    const userCollection = mongoose.connection.db.collection('users');
    const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(decoded.userId) });

    if (!user) {
      console.log('❌ USER NOT FOUND IN DATABASE!');
      console.log('   The user ID in the token doesn\'t exist');
    } else {
      console.log('✅ User exists in database');
      console.log('   - Name:', user.name);
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - Active:', user.isActive);

      if (user.role !== 'ADMIN') {
        console.log('❌ DATABASE ROLE MISMATCH!');
        console.log(`   Database role: ${user.role}`);
        console.log('   Token role: ADMIN');
      }
    }

    await mongoose.disconnect();

  } catch (error) {
    console.log('❌ TOKEN ANALYSIS FAILED:');
    console.log('   Error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      console.log('   → Token is malformed or invalid');
    } else if (error.name === 'TokenExpiredError') {
      console.log('   → Token has expired');
    } else {
      console.log('   → Other error:', error.name);
    }
  }
}

// Also provide a fresh admin token
async function generateFreshToken() {
  try {
    await mongoose.connect(MONGODB_URI);
    const userCollection = mongoose.connection.db.collection('users');
    const adminUser = await userCollection.findOne({ role: 'ADMIN' });

    if (adminUser) {
      const freshToken = jwt.sign({
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('\n🆕 FRESH ADMIN TOKEN:');
      console.log('=====================================');
      console.log(freshToken);
      console.log('=====================================');
      console.log('Use this token in your browser localStorage');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error generating fresh token:', error);
  }
}

debugBrowserToken();
generateFreshToken();