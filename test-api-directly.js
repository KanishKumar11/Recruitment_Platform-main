// Test API directly with your browser token
console.log('Testing API with your browser token...');

// Your browser token (the one that was analyzed as valid)
const browserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhiYzBiYWE2Y2NmMTY3NTA3MmIwMGUiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0MjE2Nzc4LCJleHAiOjE3NTQ4MjE1Nzh9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Replace with your actual browser token above, then run:
// curl -X POST http://localhost:3000/api/faqs -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"question\":\"Test\",\"answer\":\"Test answer\"}"

console.log('Run this curl command in your terminal:');
console.log('');
console.log(`curl -X POST http://localhost:3000/api/faqs \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${browserToken}" \\`);
console.log(`  -d '{"question":"Direct API Test","answer":"<p>Testing API directly</p>","category":"Test"}'`);
console.log('');
console.log('This will show us exactly what the API returns');