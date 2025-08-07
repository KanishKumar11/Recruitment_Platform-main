// Debug JWT token to see what's inside
const jwt = require('jsonwebtoken');

// You'll need to get the actual token from the browser's localStorage or network tab
// For now, let's create a test token to see the structure

const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Use the same secret as in .env

// Let's create a test admin token to see what it should look like
const testPayload = {
  userId: '507f1f77bcf86cd799439011', // Example ObjectId
  email: 'admin@test.com',
  role: 'ADMIN'
};

const testToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' });
console.log('Test admin token:', testToken);

// Verify the test token
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('Decoded test token:', decoded);
} catch (error) {
  console.error('Token verification error:', error);
}

// Function to decode any token (you can paste a real token here)
function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

// If you have a real token, uncomment and paste it here:
// const realToken = 'paste_your_token_here';
// decodeToken(realToken);

console.log('\nTo debug your actual token:');
console.log('1. Open browser dev tools');
console.log('2. Go to Application/Storage tab');
console.log('3. Find localStorage -> token');
console.log('4. Copy the token value and paste it in this script');