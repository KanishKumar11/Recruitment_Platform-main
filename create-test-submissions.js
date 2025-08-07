// Script to create test job submissions with additional documents
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect('mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas (simplified versions)
const ResumeSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alternativePhone: { type: String },
  country: { type: String, required: true },
  location: { type: String, required: true },
  currentCompany: { type: String, required: true },
  currentDesignation: { type: String, required: true },
  totalExperience: { type: String, required: true },
  relevantExperience: { type: String, required: true },
  currentCTC: { type: String, required: true },
  expectedCTC: { type: String, required: true },
  noticePeriod: { type: String, required: true },
  qualification: { type: String, required: true },
  remarks: { type: String },
  status: { type: String, default: 'SUBMITTED' },
  resumeFile: { type: String, required: true },
  additionalDocuments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  screeningAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    answer: { type: String }
  }],
  notes: [{
    userId: { type: mongoose.Schema.Types.ObjectId },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  shortlistedAt: { type: Date, default: null },
  onholdAt: { type: Date, default: null },
  interviewInProcessAt: { type: Date, default: null },
  interviewedAt: { type: Date, default: null },
  selectedInFinalInterviewAt: { type: Date, default: null },
  offeredAt: { type: Date, default: null },
  offerDeclinedAt: { type: Date, default: null },
  hiredAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  duplicateAt: { type: Date, default: null }
}, { timestamps: true });

const Resume = mongoose.model('Resume', ResumeSchema);

// Sample submissions data
const sampleSubmissions = [
  {
    candidateName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0101",
    alternativePhone: "+1-555-0102",
    country: "United States",
    location: "New York, NY",
    currentCompany: "Tech Solutions Inc",
    currentDesignation: "Senior Software Engineer",
    totalExperience: "6 years",
    relevantExperience: "5 years",
    currentCTC: "$95,000",
    expectedCTC: "$110,000",
    noticePeriod: "30 days",
    qualification: "Master's in Computer Science",
    remarks: "Experienced in React, Node.js, and cloud technologies",
    resumeFile: "sarah_johnson_resume.pdf",
    additionalDocuments: [
      {
        filename: "sarah_portfolio.pdf",
        originalName: "Portfolio_SarahJohnson.pdf"
      },
      {
        filename: "sarah_certificates.pdf",
        originalName: "AWS_Certifications.pdf"
      },
      {
        filename: "sarah_coverletter.docx",
        originalName: "Cover_Letter.docx"
      }
    ]
  },
  {
    candidateName: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+1-555-0201",
    country: "Canada",
    location: "Toronto, ON",
    currentCompany: "Digital Innovations Ltd",
    currentDesignation: "Full Stack Developer",
    totalExperience: "4 years",
    relevantExperience: "4 years",
    currentCTC: "CAD 75,000",
    expectedCTC: "CAD 85,000",
    noticePeriod: "15 days",
    qualification: "Bachelor's in Software Engineering",
    remarks: "Specialized in MERN stack and mobile development",
    resumeFile: "michael_chen_resume.pdf",
    additionalDocuments: [
      {
        filename: "michael_github_projects.pdf",
        originalName: "GitHub_Projects_Overview.pdf"
      },
      {
        filename: "michael_recommendation.pdf",
        originalName: "Recommendation_Letter.pdf"
      }
    ]
  },
  {
    candidateName: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91-9876543210",
    alternativePhone: "+91-9876543211",
    country: "India",
    location: "Bangalore, Karnataka",
    currentCompany: "InfoTech Solutions",
    currentDesignation: "UI/UX Designer",
    totalExperience: "3 years",
    relevantExperience: "3 years",
    currentCTC: "₹8,00,000",
    expectedCTC: "₹12,00,000",
    noticePeriod: "60 days",
    qualification: "Bachelor's in Design",
    remarks: "Expert in Figma, Adobe Creative Suite, and user research",
    resumeFile: "priya_sharma_resume.pdf",
    additionalDocuments: [
      {
        filename: "priya_design_portfolio.pdf",
        originalName: "Design_Portfolio_2024.pdf"
      },
      {
        filename: "priya_case_studies.pdf",
        originalName: "UX_Case_Studies.pdf"
      },
      {
        filename: "priya_certifications.jpg",
        originalName: "Google_UX_Certificate.jpg"
      },
      {
        filename: "priya_references.docx",
        originalName: "Professional_References.docx"
      }
    ]
  },
  {
    candidateName: "James Wilson",
    email: "james.wilson@email.com",
    phone: "+44-20-7946-0958",
    country: "United Kingdom",
    location: "London",
    currentCompany: "CloudTech Systems",
    currentDesignation: "DevOps Engineer",
    totalExperience: "5 years",
    relevantExperience: "4 years",
    currentCTC: "£65,000",
    expectedCTC: "£75,000",
    noticePeriod: "30 days",
    qualification: "Bachelor's in Computer Engineering",
    remarks: "Experienced with AWS, Docker, Kubernetes, and CI/CD pipelines",
    resumeFile: "james_wilson_resume.pdf",
    additionalDocuments: [
      {
        filename: "james_aws_certs.pdf",
        originalName: "AWS_Solutions_Architect_Certificate.pdf"
      },
      {
        filename: "james_kubernetes_cert.png",
        originalName: "Kubernetes_Administrator_Certificate.png"
      }
    ]
  },
  {
    candidateName: "Maria Rodriguez",
    email: "maria.rodriguez@email.com",
    phone: "+34-91-123-4567",
    country: "Spain",
    location: "Madrid",
    currentCompany: "DataAnalytics Pro",
    currentDesignation: "Data Scientist",
    totalExperience: "4 years",
    relevantExperience: "3 years",
    currentCTC: "€45,000",
    expectedCTC: "€55,000",
    noticePeriod: "45 days",
    qualification: "Master's in Data Science",
    remarks: "Proficient in Python, R, Machine Learning, and Big Data technologies",
    resumeFile: "maria_rodriguez_resume.pdf",
    additionalDocuments: [
      {
        filename: "maria_research_papers.pdf",
        originalName: "Published_Research_Papers.pdf"
      },
      {
        filename: "maria_ml_projects.zip",
        originalName: "Machine_Learning_Projects.zip"
      },
      {
        filename: "maria_thesis.pdf",
        originalName: "Masters_Thesis_Summary.pdf"
      }
    ]
  },
  {
    candidateName: "Alex Thompson",
    email: "alex.thompson@email.com",
    phone: "+61-2-9876-5432",
    country: "Australia",
    location: "Sydney, NSW",
    currentCompany: "MobileTech Australia",
    currentDesignation: "Mobile App Developer",
    totalExperience: "3 years",
    relevantExperience: "3 years",
    currentCTC: "AUD 80,000",
    expectedCTC: "AUD 95,000",
    noticePeriod: "21 days",
    qualification: "Bachelor's in Information Technology",
    remarks: "Specialized in iOS and Android development with React Native",
    resumeFile: "alex_thompson_resume.pdf",
    additionalDocuments: [
      {
        filename: "alex_app_portfolio.pdf",
        originalName: "Mobile_App_Portfolio.pdf"
      },
      {
        filename: "alex_app_store_links.txt",
        originalName: "Published_Apps_Links.txt"
      },
      {
        filename: "alex_code_samples.zip",
        originalName: "Code_Samples.zip"
      }
    ]
  }
];

async function createTestSubmissions() {
  try {
    console.log('Creating test job submissions with additional documents...');

    // First, let's get some existing job IDs and user IDs
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    let jobs = await Job.find().limit(6);
    let users = await User.find({ role: { $in: ['RECRUITER', 'INTERNAL'] } }).limit(6);

    // If no jobs exist, create some sample jobs
    if (jobs.length === 0) {
      console.log('No jobs found. Creating sample jobs...');
      const sampleJobs = [
        {
          title: "Senior Full Stack Developer",
          description: "Looking for an experienced full stack developer",
          location: "New York, NY",
          country: "United States",
          jobType: "FULL_TIME",
          salaryRange: "$90,000 - $120,000",
          status: "ACTIVE",
          postedBy: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "UI/UX Designer",
          description: "Creative designer for web and mobile applications",
          location: "San Francisco, CA",
          country: "United States",
          jobType: "FULL_TIME",
          salaryRange: "$70,000 - $95,000",
          status: "ACTIVE",
          postedBy: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const jobData of sampleJobs) {
        const job = new Job(jobData);
        await job.save();
        jobs.push(job);
      }
      console.log(`Created ${sampleJobs.length} sample jobs`);
    }

    // If no users exist, create some sample users
    if (users.length === 0) {
      console.log('No users found. Creating sample users...');
      const User = mongoose.model('User', new mongoose.Schema({
        name: String,
        email: String,
        role: String,
        createdAt: { type: Date, default: Date.now }
      }));

      const sampleUsers = [
        {
          name: "John Recruiter",
          email: "john.recruiter@company.com",
          role: "RECRUITER"
        },
        {
          name: "Jane Internal",
          email: "jane.internal@company.com",
          role: "INTERNAL"
        }
      ];

      for (const userData of sampleUsers) {
        const user = new User(userData);
        await user.save();
        users.push(user);
      }
      console.log(`Created ${sampleUsers.length} sample users`);
    }

    // Create submissions
    for (let i = 0; i < sampleSubmissions.length && i < jobs.length && i < users.length; i++) {
      const submissionData = {
        ...sampleSubmissions[i],
        jobId: jobs[i]._id,
        submittedBy: users[i]._id,
        status: ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEWED'][Math.floor(Math.random() * 4)]
      };

      // Add some random dates for status changes
      const submittedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
      submissionData.submittedAt = submittedDate;

      if (submissionData.status !== 'SUBMITTED') {
        submissionData.reviewedAt = new Date(submittedDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      if (submissionData.status === 'SHORTLISTED' || submissionData.status === 'INTERVIEWED') {
        submissionData.shortlistedAt = new Date(submissionData.reviewedAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
      }

      if (submissionData.status === 'INTERVIEWED') {
        submissionData.interviewedAt = new Date(submissionData.shortlistedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
      }

      const resume = new Resume(submissionData);
      await resume.save();

      console.log(`✅ Created submission for ${submissionData.candidateName} with ${submissionData.additionalDocuments.length} additional documents`);
    }

    console.log('\n🎉 Successfully created test submissions with additional documents!');
    console.log('\nSummary:');
    console.log('- Sarah Johnson: 3 additional documents (Portfolio, Certificates, Cover Letter)');
    console.log('- Michael Chen: 2 additional documents (GitHub Projects, Recommendation Letter)');
    console.log('- Priya Sharma: 4 additional documents (Portfolio, Case Studies, Certificate, References)');
    console.log('- James Wilson: 2 additional documents (AWS Certificate, Kubernetes Certificate)');
    console.log('- Maria Rodriguez: 3 additional documents (Research Papers, ML Projects, Thesis)');
    console.log('- Alex Thompson: 3 additional documents (App Portfolio, App Store Links, Code Samples)');

  } catch (error) {
    console.error('Error creating test submissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createTestSubmissions();