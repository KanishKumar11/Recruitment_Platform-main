// Script to add 20-30 sample jobs to the database
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// Use the cloud MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

const sampleJobs = [
  {
    title: "Senior Full Stack Developer",
    companyName: "TechCorp Inc",
    country: "United States",
    location: "San Francisco, CA",
    status: "ACTIVE",
    salary: { min: 120000, max: 180000, currency: "USD" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 5, max: 8 },
    description: "We are looking for an experienced Full Stack Developer to join our team...",
    sourcingGuidelines: "Please ensure candidates have React and Node.js experience",
    commission: {
      type: "percentage",
      originalPercentage: 15,
      fixedAmount: 0,
      recruiterPercentage: 9,
      platformFeePercentage: 6,
      reductionPercentage: 40,
      originalAmount: 22500,
      recruiterAmount: 13500
    },
    commissionPercentage: 15,
    commissionAmount: 22500
  },
  {
    title: "Frontend Developer",
    companyName: "Digital Solutions Ltd",
    country: "Canada",
    location: "Toronto, ON",
    status: "ACTIVE",
    salary: { min: 70000, max: 95000, currency: "CAD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Join our frontend team to build amazing user interfaces...",
    sourcingGuidelines: "Looking for Vue.js or React expertise",
    commission: {
      type: "percentage",
      originalPercentage: 12,
      fixedAmount: 0,
      recruiterPercentage: 7.2,
      platformFeePercentage: 4.8,
      reductionPercentage: 40,
      originalAmount: 9900,
      recruiterAmount: 5940
    },
    commissionPercentage: 12,
    commissionAmount: 9900
  },
  {
    title: "DevOps Engineer",
    companyName: "CloudTech Systems",
    country: "United Kingdom",
    location: "London",
    status: "ACTIVE",
    salary: { min: 60000, max: 85000, currency: "GBP" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 6 },
    description: "We need a DevOps engineer to manage our cloud infrastructure...",
    sourcingGuidelines: "AWS and Kubernetes experience required",
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
    commissionPercentage: 0,
    commissionAmount: 8000
  },
  {
    title: "Data Scientist",
    companyName: "Analytics Pro",
    country: "Australia",
    location: "Sydney, NSW",
    status: "ACTIVE",
    salary: { min: 90000, max: 130000, currency: "AUD" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 7 },
    description: "Looking for a data scientist to work on machine learning projects...",
    sourcingGuidelines: "Python, R, and machine learning experience preferred",
    commission: {
      type: "percentage",
      originalPercentage: 18,
      fixedAmount: 0,
      recruiterPercentage: 10.8,
      platformFeePercentage: 7.2,
      reductionPercentage: 40,
      originalAmount: 19800,
      recruiterAmount: 11880
    },
    commissionPercentage: 18,
    commissionAmount: 19800
  },
  {
    title: "Mobile App Developer",
    companyName: "AppWorks Studio",
    country: "Germany",
    location: "Berlin",
    status: "ACTIVE",
    salary: { min: 55000, max: 75000, currency: "EUR" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Develop mobile applications for iOS and Android platforms...",
    sourcingGuidelines: "React Native or Flutter experience",
    commission: {
      type: "percentage",
      originalPercentage: 14,
      fixedAmount: 0,
      recruiterPercentage: 8.4,
      platformFeePercentage: 5.6,
      reductionPercentage: 40,
      originalAmount: 9100,
      recruiterAmount: 5460
    },
    commissionPercentage: 14,
    commissionAmount: 9100
  },
  {
    title: "UI/UX Designer",
    companyName: "Design House",
    country: "Netherlands",
    location: "Amsterdam",
    status: "ACTIVE",
    salary: { min: 45000, max: 65000, currency: "EUR" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Create beautiful and intuitive user interfaces...",
    sourcingGuidelines: "Portfolio with web and mobile designs required",
    commission: {
      type: "percentage",
      originalPercentage: 12,
      fixedAmount: 0,
      recruiterPercentage: 7.2,
      platformFeePercentage: 4.8,
      reductionPercentage: 40,
      originalAmount: 6600,
      recruiterAmount: 3960
    },
    commissionPercentage: 12,
    commissionAmount: 6600
  },
  {
    title: "Product Manager",
    companyName: "Innovation Labs",
    country: "United States",
    location: "New York, NY",
    status: "ACTIVE",
    salary: { min: 110000, max: 150000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 4, max: 8 },
    description: "Lead product development and strategy...",
    sourcingGuidelines: "Tech product management experience required",
    commission: {
      type: "percentage",
      originalPercentage: 16,
      fixedAmount: 0,
      recruiterPercentage: 9.6,
      platformFeePercentage: 6.4,
      reductionPercentage: 40,
      originalAmount: 20800,
      recruiterAmount: 12480
    },
    commissionPercentage: 16,
    commissionAmount: 20800
  },
  {
    title: "Cybersecurity Analyst",
    companyName: "SecureNet Solutions",
    country: "United States",
    location: "Austin, TX",
    status: "ACTIVE",
    salary: { min: 85000, max: 115000, currency: "USD" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 6 },
    description: "Protect our systems from cyber threats...",
    sourcingGuidelines: "Security certifications preferred",
    commission: {
      type: "fixed",
      originalPercentage: 0,
      fixedAmount: 12000,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: 40,
      originalAmount: 12000,
      recruiterAmount: 7200
    },
    commissionPercentage: 0,
    commissionAmount: 12000
  },
  {
    title: "Backend Developer",
    companyName: "ServerWorks Inc",
    country: "India",
    location: "Bangalore",
    status: "ACTIVE",
    salary: { min: 800000, max: 1200000, currency: "INR" },
    positions: 3,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Build scalable backend systems...",
    sourcingGuidelines: "Java or Python expertise required",
    commission: {
      type: "percentage",
      originalPercentage: 10,
      fixedAmount: 0,
      recruiterPercentage: 6,
      platformFeePercentage: 4,
      reductionPercentage: 40,
      originalAmount: 100000,
      recruiterAmount: 60000
    },
    commissionPercentage: 10,
    commissionAmount: 100000
  },
  {
    title: "Machine Learning Engineer",
    companyName: "AI Innovations",
    country: "Singapore",
    location: "Singapore",
    status: "ACTIVE",
    salary: { min: 80000, max: 120000, currency: "SGD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 7 },
    description: "Develop ML models and algorithms...",
    sourcingGuidelines: "PhD in ML/AI preferred",
    commission: {
      type: "percentage",
      originalPercentage: 20,
      fixedAmount: 0,
      recruiterPercentage: 12,
      platformFeePercentage: 8,
      reductionPercentage: 40,
      originalAmount: 20000,
      recruiterAmount: 12000
    },
    commissionPercentage: 20,
    commissionAmount: 20000
  },
  {
    title: "React Developer",
    companyName: "Frontend Masters",
    country: "Canada",
    location: "Vancouver, BC",
    status: "ACTIVE",
    salary: { min: 65000, max: 85000, currency: "CAD" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 4 },
    description: "Build modern web applications with React...",
    sourcingGuidelines: "React and TypeScript experience",
    commission: {
      type: "percentage",
      originalPercentage: 13,
      fixedAmount: 0,
      recruiterPercentage: 7.8,
      platformFeePercentage: 5.2,
      reductionPercentage: 40,
      originalAmount: 9750,
      recruiterAmount: 5850
    },
    commissionPercentage: 13,
    commissionAmount: 9750
  },
  {
    title: "Cloud Architect",
    companyName: "CloudScale Technologies",
    country: "United States",
    location: "Seattle, WA",
    status: "ACTIVE",
    salary: { min: 140000, max: 200000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 7, max: 12 },
    description: "Design and implement cloud infrastructure...",
    sourcingGuidelines: "AWS/Azure architect certification required",
    commission: {
      type: "percentage",
      originalPercentage: 18,
      fixedAmount: 0,
      recruiterPercentage: 10.8,
      platformFeePercentage: 7.2,
      reductionPercentage: 40,
      originalAmount: 30600,
      recruiterAmount: 18360
    },
    commissionPercentage: 18,
    commissionAmount: 30600
  },
  {
    title: "QA Engineer",
    companyName: "Quality First Software",
    country: "United Kingdom",
    location: "Manchester",
    status: "ACTIVE",
    salary: { min: 35000, max: 50000, currency: "GBP" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 1, max: 4 },
    description: "Ensure software quality through testing...",
    sourcingGuidelines: "Automation testing experience preferred",
    commission: {
      type: "percentage",
      originalPercentage: 11,
      fixedAmount: 0,
      recruiterPercentage: 6.6,
      platformFeePercentage: 4.4,
      reductionPercentage: 40,
      originalAmount: 4675,
      recruiterAmount: 2805
    },
    commissionPercentage: 11,
    commissionAmount: 4675
  },
  {
    title: "Software Architect",
    companyName: "Architecture Solutions",
    country: "Switzerland",
    location: "Zurich",
    status: "ACTIVE",
    salary: { min: 110000, max: 150000, currency: "CHF" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 8, max: 15 },
    description: "Lead software architecture decisions...",
    sourcingGuidelines: "Enterprise architecture experience",
    commission: {
      type: "fixed",
      originalPercentage: 0,
      fixedAmount: 20000,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: 40,
      originalAmount: 20000,
      recruiterAmount: 12000
    },
    commissionPercentage: 0,
    commissionAmount: 20000
  },
  {
    title: "Python Developer",
    companyName: "Python Solutions",
    country: "Spain",
    location: "Madrid",
    status: "ACTIVE",
    salary: { min: 40000, max: 60000, currency: "EUR" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Develop Python applications and APIs...",
    sourcingGuidelines: "Django or Flask experience",
    commission: {
      type: "percentage",
      originalPercentage: 12,
      fixedAmount: 0,
      recruiterPercentage: 7.2,
      platformFeePercentage: 4.8,
      reductionPercentage: 40,
      originalAmount: 6000,
      recruiterAmount: 3600
    },
    commissionPercentage: 12,
    commissionAmount: 6000
  },
  {
    title: "Blockchain Developer",
    companyName: "CryptoTech Inc",
    country: "United States",
    location: "Miami, FL",
    status: "ACTIVE",
    salary: { min: 100000, max: 140000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Build decentralized applications...",
    sourcingGuidelines: "Solidity and Web3 experience",
    commission: {
      type: "percentage",
      originalPercentage: 22,
      fixedAmount: 0,
      recruiterPercentage: 13.2,
      platformFeePercentage: 8.8,
      reductionPercentage: 40,
      originalAmount: 26400,
      recruiterAmount: 15840
    },
    commissionPercentage: 22,
    commissionAmount: 26400
  },
  {
    title: "Game Developer",
    companyName: "GameStudio Pro",
    country: "Japan",
    location: "Tokyo",
    status: "ACTIVE",
    salary: { min: 4000000, max: 6000000, currency: "JPY" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 6 },
    description: "Create engaging gaming experiences...",
    sourcingGuidelines: "Unity or Unreal Engine experience",
    commission: {
      type: "percentage",
      originalPercentage: 15,
      fixedAmount: 0,
      recruiterPercentage: 9,
      platformFeePercentage: 6,
      reductionPercentage: 40,
      originalAmount: 750000,
      recruiterAmount: 450000
    },
    commissionPercentage: 15,
    commissionAmount: 750000
  },
  {
    title: "Database Administrator",
    companyName: "DataManage Corp",
    country: "Brazil",
    location: "São Paulo",
    status: "ACTIVE",
    salary: { min: 60000, max: 90000, currency: "BRL" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 7 },
    description: "Manage and optimize database systems...",
    sourcingGuidelines: "Oracle or PostgreSQL expertise",
    commission: {
      type: "percentage",
      originalPercentage: 13,
      fixedAmount: 0,
      recruiterPercentage: 7.8,
      platformFeePercentage: 5.2,
      reductionPercentage: 40,
      originalAmount: 9750,
      recruiterAmount: 5850
    },
    commissionPercentage: 13,
    commissionAmount: 9750
  },
  {
    title: "Technical Writer",
    companyName: "DocuTech Solutions",
    country: "Ireland",
    location: "Dublin",
    status: "ACTIVE",
    salary: { min: 45000, max: 65000, currency: "EUR" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Create technical documentation...",
    sourcingGuidelines: "Technical writing portfolio required",
    commission: {
      type: "percentage",
      originalPercentage: 10,
      fixedAmount: 0,
      recruiterPercentage: 6,
      platformFeePercentage: 4,
      reductionPercentage: 40,
      originalAmount: 5500,
      recruiterAmount: 3300
    },
    commissionPercentage: 10,
    commissionAmount: 5500
  },
  {
    title: "Site Reliability Engineer",
    companyName: "ReliableSys Inc",
    country: "Sweden",
    location: "Stockholm",
    status: "ACTIVE",
    salary: { min: 500000, max: 700000, currency: "SEK" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 4, max: 8 },
    description: "Ensure system reliability and performance...",
    sourcingGuidelines: "Kubernetes and monitoring tools experience",
    commission: {
      type: "fixed",
      originalPercentage: 0,
      fixedAmount: 50000,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: 40,
      originalAmount: 50000,
      recruiterAmount: 30000
    },
    commissionPercentage: 0,
    commissionAmount: 50000
  },
  {
    title: "iOS Developer",
    companyName: "MobileFirst LLC",
    country: "United States",
    location: "Los Angeles, CA",
    status: "ACTIVE",
    salary: { min: 95000, max: 130000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 6 },
    description: "Develop native iOS applications...",
    sourcingGuidelines: "Swift and iOS SDK experience",
    commission: {
      type: "percentage",
      originalPercentage: 14,
      fixedAmount: 0,
      recruiterPercentage: 8.4,
      platformFeePercentage: 5.6,
      reductionPercentage: 40,
      originalAmount: 15750,
      recruiterAmount: 9450
    },
    commissionPercentage: 14,
    commissionAmount: 15750
  },
  {
    title: "Android Developer",
    companyName: "AndroidWorks Studio",
    country: "South Korea",
    location: "Seoul",
    status: "ACTIVE",
    salary: { min: 35000000, max: 50000000, currency: "KRW" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Build Android applications...",
    sourcingGuidelines: "Kotlin and Android SDK experience",
    commission: {
      type: "percentage",
      originalPercentage: 13,
      fixedAmount: 0,
      recruiterPercentage: 7.8,
      platformFeePercentage: 5.2,
      reductionPercentage: 40,
      originalAmount: 5525000,
      recruiterAmount: 3315000
    },
    commissionPercentage: 13,
    commissionAmount: 5525000
  },
  {
    title: "Scrum Master",
    companyName: "AgileTeams Inc",
    country: "France",
    location: "Paris",
    status: "ACTIVE",
    salary: { min: 50000, max: 70000, currency: "EUR" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 6 },
    description: "Facilitate agile development processes...",
    sourcingGuidelines: "Certified Scrum Master preferred",
    commission: {
      type: "percentage",
      originalPercentage: 12,
      fixedAmount: 0,
      recruiterPercentage: 7.2,
      platformFeePercentage: 4.8,
      reductionPercentage: 40,
      originalAmount: 7200,
      recruiterAmount: 4320
    },
    commissionPercentage: 12,
    commissionAmount: 7200
  },
  {
    title: "Business Analyst",
    companyName: "BizAnalytics Corp",
    country: "Australia",
    location: "Melbourne",
    status: "ACTIVE",
    salary: { min: 75000, max: 100000, currency: "AUD" },
    positions: 2,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 6 },
    description: "Analyze business requirements and processes...",
    sourcingGuidelines: "Business analysis certification preferred",
    commission: {
      type: "percentage",
      originalPercentage: 11,
      fixedAmount: 0,
      recruiterPercentage: 6.6,
      platformFeePercentage: 4.4,
      reductionPercentage: 40,
      originalAmount: 9625,
      recruiterAmount: 5775
    },
    commissionPercentage: 11,
    commissionAmount: 9625
  },
  {
    title: "Solutions Engineer",
    companyName: "SolutionPro Tech",
    country: "United States",
    location: "Chicago, IL",
    status: "ACTIVE",
    salary: { min: 90000, max: 120000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 7 },
    description: "Design technical solutions for clients...",
    sourcingGuidelines: "Pre-sales engineering experience",
    commission: {
      type: "percentage",
      originalPercentage: 15,
      fixedAmount: 0,
      recruiterPercentage: 9,
      platformFeePercentage: 6,
      reductionPercentage: 40,
      originalAmount: 15750,
      recruiterAmount: 9450
    },
    commissionPercentage: 15,
    commissionAmount: 15750
  },
  {
    title: "Marketing Automation Specialist",
    companyName: "MarketingTech Pro",
    country: "United Kingdom",
    location: "Edinburgh",
    status: "ACTIVE",
    salary: { min: 40000, max: 55000, currency: "GBP" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 5 },
    description: "Implement marketing automation systems...",
    sourcingGuidelines: "HubSpot or Marketo experience",
    commission: {
      type: "percentage",
      originalPercentage: 12,
      fixedAmount: 0,
      recruiterPercentage: 7.2,
      platformFeePercentage: 4.8,
      reductionPercentage: 40,
      originalAmount: 5700,
      recruiterAmount: 3420
    },
    commissionPercentage: 12,
    commissionAmount: 5700
  },
  {
    title: "Network Engineer",
    companyName: "NetSolutions Inc",
    country: "United States",
    location: "Denver, CO",
    status: "ACTIVE",
    salary: { min: 75000, max: 100000, currency: "USD" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 3, max: 7 },
    description: "Design and maintain network infrastructure...",
    sourcingGuidelines: "Cisco certification preferred",
    commission: {
      type: "percentage",
      originalPercentage: 13,
      fixedAmount: 0,
      recruiterPercentage: 7.8,
      platformFeePercentage: 5.2,
      reductionPercentage: 40,
      originalAmount: 11375,
      recruiterAmount: 6825
    },
    commissionPercentage: 13,
    commissionAmount: 11375
  },
  {
    title: "WordPress Developer",
    companyName: "WebCraft Studios",
    country: "Philippines",
    location: "Manila",
    status: "ACTIVE",
    salary: { min: 500000, max: 800000, currency: "PHP" },
    positions: 3,
    jobType: "FULL_TIME",
    experienceLevel: { min: 1, max: 4 },
    description: "Develop custom WordPress themes and plugins...",
    sourcingGuidelines: "WordPress and PHP expertise",
    commission: {
      type: "percentage",
      originalPercentage: 10,
      fixedAmount: 0,
      recruiterPercentage: 6,
      platformFeePercentage: 4,
      reductionPercentage: 40,
      originalAmount: 65000,
      recruiterAmount: 39000
    },
    commissionPercentage: 10,
    commissionAmount: 65000
  },
  {
    title: "Systems Administrator",
    companyName: "SysAdmin Solutions",
    country: "Germany",
    location: "Munich",
    status: "ACTIVE",
    salary: { min: 50000, max: 70000, currency: "EUR" },
    positions: 1,
    jobType: "FULL_TIME",
    experienceLevel: { min: 2, max: 6 },
    description: "Manage server infrastructure and systems...",
    sourcingGuidelines: "Linux administration experience",
    commission: {
      type: "percentage",
      originalPercentage: 11,
      fixedAmount: 0,
      recruiterPercentage: 6.6,
      platformFeePercentage: 4.4,
      reductionPercentage: 40,
      originalAmount: 6600,
      recruiterAmount: 3960
    },
    commissionPercentage: 11,
    commissionAmount: 6600
  }
];

function generateJobCode() {
  return 'JOB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function addSampleJobs() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    const usersCollection = db.collection('users');
    
    // Find an admin or internal user to assign as postedBy
    const adminUser = await usersCollection.findOne({ role: { $in: ['ADMIN', 'INTERNAL'] } });
    
    if (!adminUser) {
      console.error('No admin or internal user found. Please create an admin user first.');
      return;
    }
    
    console.log(`Found user: ${adminUser.name || adminUser.email} to assign as poster`);
    
    // Prepare jobs with proper structure
    const jobsToInsert = sampleJobs.map(job => ({
      ...job,
      jobCode: generateJobCode(),
      postedBy: adminUser._id,
      postedByName: adminUser.name || adminUser.email,
      postedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      applicantCount: Math.floor(Math.random() * 50), // Random applicant count
      screeningQuestions: [],
      paymentTerms: "Monthly salary",
      compensationDetails: "Competitive salary package",
      replacementTerms: "30-day replacement guarantee"
    }));
    
    console.log(`Inserting ${jobsToInsert.length} sample jobs...`);
    
    const result = await jobsCollection.insertMany(jobsToInsert);
    
    console.log(`Successfully inserted ${result.insertedCount} jobs!`);
    console.log('Sample job IDs:', Object.values(result.insertedIds));
    
  } catch (error) {
    console.error('Error adding sample jobs:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
addSampleJobs().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
