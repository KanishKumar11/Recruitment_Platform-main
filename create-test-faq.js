// Test script to create a sample FAQ
const mongoose = require('mongoose');

// Connect to MongoDB - use the same URI as the app
const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

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

async function createTestFAQ() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to use as creator
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String
    }));

    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Create sample FAQs
    const sampleFAQs = [
      {
        question: "How do I post a job on SourcingScreen?",
        answer: "<p>To post a job on SourcingScreen:</p><ol><li>Log in to your company dashboard</li><li>Click on 'Post New Job'</li><li>Fill in the job details including title, description, and requirements</li><li>Set your commission structure for recruiters</li><li>Add any screening questions</li><li>Review and publish your job</li></ol><p>Your job will be visible to our network of verified recruiters immediately.</p>",
        category: "Job Posting",
        isActive: true,
        order: 1,
        allowInternalEdit: false,
        createdBy: adminUser._id
      },
      {
        question: "How do recruiters submit candidates?",
        answer: "<p>Recruiters can submit candidates by:</p><ol><li>Browsing available jobs in their dashboard</li><li>Clicking 'Apply' on a relevant job</li><li>Uploading the candidate's resume and additional documents</li><li>Answering any screening questions</li><li>Submitting the application</li></ol><p>The hiring company will be notified immediately and can review the submission.</p>",
        category: "Recruitment Process",
        isActive: true,
        order: 2,
        allowInternalEdit: true,
        createdBy: adminUser._id
      },
      {
        question: "What are the commission rates?",
        answer: "<p>Commission rates vary by job and are set by the hiring company. Typical ranges include:</p><ul><li><strong>Standard roles:</strong> 15-20% of first year salary</li><li><strong>Executive roles:</strong> 20-25% of first year salary</li><li><strong>Specialized/Hard-to-fill roles:</strong> 25-30% of first year salary</li></ul><p>The exact commission rate is displayed on each job posting before you submit a candidate.</p>",
        category: "Payments",
        isActive: true,
        order: 3,
        allowInternalEdit: false,
        createdBy: adminUser._id
      },
      {
        question: "How long does the hiring process take?",
        answer: "<p>The hiring timeline varies by company and role, but typically:</p><ul><li><strong>Initial review:</strong> 1-3 business days</li><li><strong>First interview:</strong> 3-7 business days</li><li><strong>Final decision:</strong> 1-2 weeks</li></ul><p>You'll receive updates throughout the process via email and your dashboard notifications.</p>",
        category: "General",
        isActive: true,
        order: 4,
        allowInternalEdit: true,
        createdBy: adminUser._id
      },
      {
        question: "How do I get paid?",
        answer: "<p>Payment is processed after successful candidate placement:</p><ol><li>Candidate starts work and completes probation period (usually 30-90 days)</li><li>Company confirms successful placement</li><li>Invoice is generated automatically</li><li>Payment is processed within 30 days</li></ol><p>You can track all your placements and payments in the 'Earnings' section of your dashboard.</p>",
        category: "Payments",
        isActive: true,
        order: 5,
        allowInternalEdit: false,
        createdBy: adminUser._id
      }
    ];

    // Clear existing test FAQs
    await FAQ.deleteMany({ question: { $in: sampleFAQs.map(faq => faq.question) } });

    // Create new FAQs
    const createdFAQs = await FAQ.insertMany(sampleFAQs);
    console.log(`Created ${createdFAQs.length} sample FAQs:`);

    createdFAQs.forEach((faq, index) => {
      console.log(`${index + 1}. ${faq.question} (${faq.category})`);
    });

    console.log('\nFAQ system is ready! You can now:');
    console.log('- Visit http://localhost:3000/faq to see the public FAQ page');
    console.log('- Login as admin and go to /dashboard/admin/faqs to manage FAQs');
    console.log('- Login as internal user and go to /dashboard/internal/faqs to edit permitted FAQs');

  } catch (error) {
    console.error('Error creating test FAQs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestFAQ();