// src/app/models/Resume.ts - Updated with indexes
import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ResumeStatus {
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  SHORTLISTED = 'SHORTLISTED',
  ONHOLD = 'ONHOLD',
  INTERVIEW_IN_PROCESS = 'INTERVIEW_IN_PROCESS',
  INTERVIEWED = 'INTERVIEWED',
  SELECTED_IN_FINAL_INTERVIEW = 'SELECTED_IN_FINAL_INTERVIEW',
  OFFERED = 'OFFERED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  DUPLICATE = 'DUPLICATE'
}

export interface IResume extends Document {
  jobId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  candidateName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  country: string;
  location: string;
  currentCompany: string;
  currentDesignation: string;
  totalExperience: string;
  relevantExperience: string;
  currentCTC: string;
  expectedCTC: string;
  noticePeriod: string;
  qualification: string;
  remarks: string;
  status: ResumeStatus;
  resumeFile: string;
  submittedByName?: string;
        
  // Status timestamps
  submittedAt: Date;
  reviewedAt: Date | null;
  shortlistedAt: Date | null;
  onholdAt: Date | null;
  interviewInProcessAt: Date | null;
  interviewedAt: Date | null;
  selectedInFinalInterviewAt: Date | null;
  offeredAt: Date | null;
  offerDeclinedAt: Date | null;
  hiredAt: Date | null;
  rejectedAt: Date | null;
  duplicateAt: Date | null;
        
  screeningAnswers: {
    questionId: mongoose.Types.ObjectId;
    answer: string;
  }[];
  notes: {
    userId: mongoose.Types.ObjectId;
    note: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  jobTitle: string;
}

const ResumeSchema = new Schema<IResume>(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    candidateName: { type: String, required: true },
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    phone: { 
      type: String, 
      required: true,
      trim: true
    },
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
    status: {
       type: String,
       enum: Object.values(ResumeStatus),
       default: ResumeStatus.SUBMITTED
     },
    resumeFile: { type: String, required: true },
              
    // Status timestamps
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
    duplicateAt: { type: Date, default: null },
              
    screeningAnswers: [{
      questionId: {
         type: mongoose.Schema.Types.ObjectId,
        ref: 'ScreeningQuestion',
        required: true
      },
      answer: { type: String, required: true }
    }],
    notes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      note: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Add compound indexes to prevent duplicate applications for the same job
ResumeSchema.index({ email: 1, jobId: 1 }, { unique: true });
ResumeSchema.index({ phone: 1, jobId: 1 }, { unique: true });

// Add individual indexes for faster queries
ResumeSchema.index({ email: 1 });
ResumeSchema.index({ phone: 1 });
ResumeSchema.index({ jobId: 1 });
ResumeSchema.index({ status: 1 });
ResumeSchema.index({ submittedBy: 1 });

// Fix for "cannot read properties of undefined (reading 'Resume')"
let ResumeModel: Model<IResume>;

// Check if model already exists to prevent OverwriteModelError
try {
  ResumeModel = mongoose.model<IResume>('Resume');
} catch {
  ResumeModel = mongoose.model<IResume>('Resume', ResumeSchema);
}

export default ResumeModel;