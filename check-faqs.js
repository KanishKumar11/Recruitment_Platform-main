// Check if FAQs exist in database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

async function checkFAQs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check if FAQ collection exists
    const faqCollection = mongoose.connection.db.collection('faqs');
    const faqCount = await faqCollection.countDocuments();
    console.log(`FAQ collection has ${faqCount} documents`);

    if (faqCount > 0) {
      const faqs = await faqCollection.find({}).toArray();
      console.log('FAQs in database:');
      faqs.forEach((faq, index) => {
        console.log(`${index + 1}. ${faq.question} - Active: ${faq.isActive}`);
      });
    }

  } catch (error) {
    console.error('Error checking FAQs:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkFAQs();