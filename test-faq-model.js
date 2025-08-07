// Test the FAQ model directly
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-platform';

// Define the FAQ schema exactly as in the TypeScript model
const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  allowInternalEdit: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

async function testFAQModel() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test the query that the API is using
    const query = { isActive: true };
    console.log('Testing query:', query);

    const faqs = await FAQ.find(query).sort({ category: 1, order: 1, createdAt: -1 });
    console.log(`Found ${faqs.length} FAQs with the API query`);

    if (faqs.length > 0) {
      console.log('First FAQ:', {
        question: faqs[0].question,
        category: faqs[0].category,
        isActive: faqs[0].isActive
      });
    }

    // Test without any query
    const allFaqs = await FAQ.find({});
    console.log(`Total FAQs in database: ${allFaqs.length}`);

  } catch (error) {
    console.error('Error testing FAQ model:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testFAQModel();