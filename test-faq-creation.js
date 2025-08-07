// Test FAQ creation with proper authentication
const fetch = require('node-fetch');

async function testFAQCreation() {
  try {
    // First, let's try to login as admin to get a token
    console.log('Attempting to login as admin...');

    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Replace with actual admin email
        password: 'admin123' // Replace with actual admin password
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed. Let\'s check what admin users exist...');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful!');

    const token = loginData.token;

    // Now try to create an FAQ
    console.log('Attempting to create FAQ...');

    const faqResponse = await fetch('http://localhost:3000/api/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question: 'Test FAQ Question',
        answer: 'This is a test FAQ answer.',
        category: 'General',
        isActive: true,
        order: 1,
        allowInternalEdit: false
      })
    });

    const faqData = await faqResponse.json();

    if (faqResponse.ok) {
      console.log('FAQ created successfully:', faqData);
    } else {
      console.log('FAQ creation failed:', faqResponse.status, faqData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testFAQCreation();