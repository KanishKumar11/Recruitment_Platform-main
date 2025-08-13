// add-sample-jobs.js - Script to add dummy jobs with screening questions
const mongoose = require('mongoose');

// Simple environment variable loading without dotenv
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-platform';

// Since we can't easily import ES modules, let's create the schemas directly
const jobSchema = new mongoose.Schema({
  title: String,
  jobCode: String,
  companyName: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedByName: String,
  postedByCompany: String,
  company: String,
  postedDate: Date,
  country: String,
  location: String,
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'] },
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  compensationType: { type: String, enum: ['HOURLY', 'MONTHLY', 'ANNUALLY'] },
  paymentTerms: String,
  positions: Number,
  jobType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] },
  experienceLevel: {
    min: Number,
    max: Number
  },
  compensationDetails: String,
  replacementTerms: String,
  commission: {
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    originalPercentage: { type: Number, default: 0 },
    fixedAmount: { type: Number, default: 0 },
    recruiterPercentage: { type: Number, default: 0 },
    platformFeePercentage: { type: Number, default: 0 },
    reductionPercentage: { type: Number, default: 40 },
    originalAmount: { type: Number, default: 0 },
    recruiterAmount: { type: Number, default: 0 }
  },
  description: String,
  companyDescription: String,
  sourcingGuidelines: String,
  screeningQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ScreeningQuestion' }],
  applicantCount: { type: Number, default: 0 }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['COMPANY', 'RECRUITER', 'ADMIN', 'INTERNAL'] },
  companyName: String,
  isVerified: { type: Boolean, default: false },
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true });

const screeningQuestionSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  question: { type: String, required: true },
  questionType: { type: String, enum: ['TEXT', 'NUMERIC', 'YES_NO', 'MCQ', 'MULTI_SELECT'], required: true },
  options: [String],
  required: { type: Boolean, default: false },
  order: { type: Number, required: false }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
const User = mongoose.model('User', userSchema);
const ScreeningQuestion = mongoose.model('ScreeningQuestion', screeningQuestionSchema);

const sampleJobs = [
  {
    title: "Senior Full Stack Developer",
    jobCode: "DEV-2025-001",
    companyName: "TechCorp Solutions",
    country: "United States",
    location: "New York, NY",
    status: "ACTIVE",
    salary: {
      min: 120000,
      max: 160000,
      currency: "USD"
    },
    compensationType: "ANNUALLY",
    paymentTerms: "Monthly salary payment with annual bonus",
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: {
      min: 5,
      max: 8
    },
    compensationDetails: "Competitive salary with equity options, health insurance, 401k matching",
    replacementTerms: "90-day replacement guarantee",
    commission: {
      type: "percentage",
      originalPercentage: 15,
      fixedAmount: 0,
      recruiterPercentage: 9,
      platformFeePercentage: 6,
      reductionPercentage: 40,
      originalAmount: 0,
      recruiterAmount: 0
    },
    description: `
We are seeking a Senior Full Stack Developer to join our dynamic engineering team. 

**Key Responsibilities:**
- Design and develop scalable web applications using React, Node.js, and TypeScript
- Collaborate with product managers and designers to implement user-facing features
- Write clean, maintainable code and conduct code reviews
- Optimize applications for maximum speed and scalability
- Mentor junior developers and contribute to technical decisions

**Required Skills:**
- 5+ years of experience in full-stack development
- Expert knowledge of React, Node.js, TypeScript, and modern JavaScript
- Experience with databases (PostgreSQL, MongoDB)
- Proficiency with Git, Docker, and cloud platforms (AWS/Azure)
- Strong understanding of RESTful APIs and microservices architecture

**Nice to Have:**
- Experience with Next.js, GraphQL
- Knowledge of DevOps practices and CI/CD pipelines
- Previous experience in fintech or healthcare domains
    `.trim(),
    companyDescription: "TechCorp Solutions is a leading technology company specializing in enterprise software solutions. We serve Fortune 500 companies across various industries and are known for our innovative approach to solving complex business challenges.",
    sourcingGuidelines: `
**Ideal Candidate Profile:**
- Must have hands-on experience with React and Node.js
- Should have worked in fast-paced startup or enterprise environments
- Strong communication skills and ability to work in cross-functional teams
- Bachelor's degree in Computer Science or equivalent experience
- Located in or willing to relocate to New York area

**Screening Priority:**
1. Technical skills assessment
2. Previous project experience
3. Cultural fit and communication skills
4. Availability and notice period
    `.trim(),
    screeningQuestions: [
      {
        question: "How many years of experience do you have with React and Node.js development?",
        questionType: "NUMERIC",
        options: [],
        required: true,
        order: 1
      },
      {
        question: "Which of the following databases have you worked with professionally?",
        questionType: "MULTI_SELECT",
        options: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch", "DynamoDB"],
        required: true,
        order: 2
      },
      {
        question: "Have you ever led a team of developers or mentored junior developers?",
        questionType: "YES_NO",
        options: [],
        required: true,
        order: 3
      },
      {
        question: "Describe a challenging technical problem you solved in your previous role and the approach you took.",
        questionType: "TEXT",
        options: [],
        required: true,
        order: 4
      },
      {
        question: "What is your preferred cloud platform for deployment?",
        questionType: "MCQ",
        options: ["AWS", "Azure", "Google Cloud", "Other"],
        required: true,
        order: 5
      }
    ]
  },
  {
    title: "Digital Marketing Manager",
    jobCode: "MKT-2025-002",
    companyName: "Growth Marketing Inc",
    country: "Canada",
    location: "Toronto, ON",
    status: "ACTIVE",
    salary: {
      min: 65000,
      max: 85000,
      currency: "CAD"
    },
    compensationType: "ANNUALLY",
    paymentTerms: "Bi-weekly salary with quarterly performance bonuses",
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: {
      min: 3,
      max: 6
    },
    compensationDetails: "Comprehensive benefits package including health, dental, vision, and professional development budget",
    replacementTerms: "60-day replacement guarantee",
    commission: {
      type: "fixed",
      originalPercentage: 0,
      fixedAmount: 8000,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: 40,
      originalAmount: 8000,
      recruiterAmount: 4800
    },
    description: `
Join our marketing team as a Digital Marketing Manager to drive our online presence and customer acquisition.

**Key Responsibilities:**
- Develop and execute comprehensive digital marketing strategies
- Manage social media accounts and content calendar
- Plan and optimize paid advertising campaigns (Google Ads, Facebook, LinkedIn)
- Analyze marketing metrics and prepare performance reports
- Collaborate with sales team to generate and nurture leads

**Required Skills:**
- 3+ years of digital marketing experience
- Proficiency with Google Analytics, Google Ads, Facebook Business Manager
- Experience with marketing automation tools (HubSpot, Marketo, or similar)
- Strong analytical skills and data-driven mindset
- Excellent written and verbal communication skills

**Preferred Qualifications:**
- Bachelor's degree in Marketing, Business, or related field
- Google Ads and Analytics certifications
- Experience with A/B testing and conversion optimization
    `.trim(),
    companyDescription: "Growth Marketing Inc is a fast-growing digital marketing agency that helps B2B companies scale their online presence and generate qualified leads.",
    sourcingGuidelines: `
**Target Candidate:**
- Digital marketing experience in B2B environment preferred
- Must have hands-on experience with paid advertising platforms
- Strong analytical mindset with ability to interpret data
- Located in Toronto or GTA area
- Available to start within 4-6 weeks
    `.trim(),
    screeningQuestions: [
      {
        question: "What is your total years of experience in digital marketing?",
        questionType: "NUMERIC",
        options: [],
        required: true,
        order: 1
      },
      {
        question: "Which digital marketing tools and platforms have you used? (Select all that apply)",
        questionType: "MULTI_SELECT",
        options: ["Google Ads", "Facebook Ads Manager", "LinkedIn Campaign Manager", "Google Analytics", "HubSpot", "Marketo", "Mailchimp", "SEMrush"],
        required: true,
        order: 2
      },
      {
        question: "Do you have any Google or Facebook marketing certifications?",
        questionType: "YES_NO",
        options: [],
        required: true,
        order: 3
      },
      {
        question: "Describe a successful digital marketing campaign you managed. What were the results?",
        questionType: "TEXT",
        options: [],
        required: true,
        order: 4
      },
      {
        question: "What is your preferred method for measuring campaign success?",
        questionType: "MCQ",
        options: ["ROI/ROAS", "Lead Quality Score", "Conversion Rate", "Cost per Acquisition", "Brand Awareness Metrics"],
        required: true,
        order: 5
      }
    ]
  }
];

async function addSampleJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create a sample company user to post these jobs
    let sampleUser = await User.findOne({ email: 'company@techcorp.com' });

    if (!sampleUser) {
      sampleUser = new User({
        name: 'TechCorp Admin',
        email: 'company@techcorp.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPMVinePPEzUu', // hashed "password123"
        role: 'COMPANY',
        companyName: 'TechCorp Solutions',
        isVerified: true,
        isPrimary: true
      });
      await sampleUser.save();
      console.log('Created sample company user');
    }

    for (const jobData of sampleJobs) {
      // Create the job first (without screening questions)
      const { screeningQuestions: questionsData, ...jobWithoutQuestions } = jobData;

      const job = new Job({
        ...jobWithoutQuestions,
        postedBy: sampleUser._id,
        postedByName: sampleUser.name,
        postedByCompany: sampleUser.companyName,
        company: sampleUser.companyName,
        screeningQuestions: [], // Will be updated after creating questions
        postedDate: new Date(),
        applicantCount: 0
      });

      await job.save();
      console.log(`Created job: ${job.title} (${job.jobCode})`);

      // Create screening questions and link them to the job
      const screeningQuestionIds = [];

      for (const questionData of questionsData) {
        const question = new ScreeningQuestion({
          jobId: job._id,
          question: questionData.question,
          questionType: questionData.questionType,
          options: questionData.options,
          required: questionData.required,
          order: questionData.order
        });
        await question.save();
        screeningQuestionIds.push(question._id);
        console.log(`  - Added screening question: ${questionData.question}`);
      }

      // Update job with screening question IDs
      job.screeningQuestions = screeningQuestionIds;
      await job.save();
      console.log(`  - Linked ${screeningQuestionIds.length} screening questions to job`);
    }

    console.log('✅ All sample jobs with screening questions have been added successfully!');

  } catch (error) {
    console.error('Error adding sample jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  addSampleJobs();
}

module.exports = { addSampleJobs, sampleJobs };