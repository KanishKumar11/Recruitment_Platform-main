// src/app/models/Job.ts
import mongoose, { Schema, Document } from "mongoose";
// Ensure ScreeningQuestion model is imported and registered first
import "./ScreeningQuestion";

export enum JobStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  FREELANCE = "FREELANCE",
  INTERNSHIP = "INTERNSHIP",
}

// Commission configuration - can be moved to a config file
export const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 50, // 50% reduction by default
  MIN_REDUCTION_PERCENTAGE: 0, // Minimum 0% platform fee
  MAX_REDUCTION_PERCENTAGE: 80, // Maximum 80% platform fee
  MIN_COMMISSION_PERCENTAGE: 1, // Minimum 1% commission
  MAX_COMMISSION_PERCENTAGE: 50, // Maximum 50% commission
};

export interface IJobCommission {
  type: "percentage" | "fixed" | "hourly"; // New field to track commission type
  originalPercentage: number; // Set by company (for percentage-based)
  fixedAmount: number; // New field for fixed commission amount
  hourlyRate: number; // New field for hourly commission rate
  recruiterPercentage: number; // Calculated and shown to recruiters (for percentage-based)
  platformFeePercentage: number; // Platform's cut (for percentage-based)
  reductionPercentage: number; // Configurable reduction percentage
  originalAmount: number; // Original commission amount
  recruiterAmount: number; // Amount shown to recruiters
}

export interface IJob extends Document {
  applicantCount: number;
  title: string;
  jobCode: string;
  companyName: string;
  postedBy: mongoose.Types.ObjectId;
  postedDate: Date;
  country: string;
  location: string;
  status: JobStatus;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  compensationType: "HOURLY" | "MONTHLY" | "ANNUALLY";
  paymentTerms: string;
  positions: number;
  jobType: JobType;
  experienceLevel: {
    min: number;
    max: number;
  };
  compensationDetails: string;
  replacementTerms: string;

  // Updated commission structure
  commission: IJobCommission;

  // Legacy fields for backward compatibility
  commissionPercentage: number;
  commissionAmount: number;

  description: string;
  companyDescription?: string; // Optional company description
  sourcingGuidelines: string;
  screeningQuestions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Added property for team member name
  postedByName?: string; // Name of the user who posted the job
  postedByCompany?: string;
  company?: string;
}

const CommissionSchema = new Schema<IJobCommission>({
  type: {
    type: String,
    enum: ["percentage", "fixed", "hourly"],
    default: "percentage",
    required: true,
  },
  originalPercentage: { type: Number, default: 0 },
  fixedAmount: { type: Number, default: 0 }, // New field
  hourlyRate: { type: Number, default: 0 }, // New field for hourly commission rate
  recruiterPercentage: { type: Number, default: 0 },
  platformFeePercentage: { type: Number, default: 0 },
  reductionPercentage: {
    type: Number,
    default: COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
  },
  originalAmount: { type: Number, default: 0 },
  recruiterAmount: { type: Number, default: 0 },
});

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    jobCode: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedDate: { type: Date, default: Date.now },
    country: { type: String, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
      required: true,
    },
    salary: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: "USD", required: true },
    },
    compensationType: {
      type: String,
      enum: ["HOURLY", "MONTHLY", "ANNUALLY"],
      default: "ANNUALLY",
      required: true,
    },
    paymentTerms: { type: String },
    positions: { type: Number, default: 1, required: true },
    jobType: {
      type: String,
      enum: Object.values(JobType),
      default: JobType.FULL_TIME,
      required: true,
    },
    experienceLevel: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    compensationDetails: { type: String },
    replacementTerms: { type: String },

    // New commission structure
    commission: {
      type: CommissionSchema,
      required: true,
    },

    // Legacy fields for backward compatibility
    commissionPercentage: { type: Number },
    commissionAmount: { type: Number },

    description: { type: String, required: true },
    companyDescription: { type: String, default: "" }, // Optional field
    sourcingGuidelines: { type: String },
    screeningQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScreeningQuestion",
      },
    ],
    applicantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Commission calculation utilities
export class CommissionCalculator {
  static calculateRecruiterCommission(
    originalCommission: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
  ): number {
    if (originalCommission <= 0) return 0;

    const reduction = (originalCommission * reductionPercentage) / 100;
    const recruiterCommission = originalCommission - reduction;

    // Ensure minimum commission
    return Math.max(
      recruiterCommission,
      COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
    );
  }

  static calculatePlatformFee(
    originalCommission: number,
    recruiterCommission: number
  ): number {
    return Math.max(0, originalCommission - recruiterCommission);
  }

  static calculateCommissionAmount(
    salary: number,
    commissionPercentage: number
  ): number {
    return (salary * commissionPercentage) / 100;
  }

  // New function to calculate fixed commission breakdown
  static calculateFixedCommissionBreakdown(
    fixedAmount: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
  ): { recruiterAmount: number; platformFeeAmount: number } {
    if (fixedAmount <= 0) return { recruiterAmount: 0, platformFeeAmount: 0 };

    const platformFeeAmount = (fixedAmount * reductionPercentage) / 100;
    const recruiterAmount = fixedAmount - platformFeeAmount;

    return {
      recruiterAmount: Math.max(recruiterAmount, 0),
      platformFeeAmount,
    };
  }

  static createCommissionStructure(
    type: "percentage" | "fixed" | "hourly",
    originalPercentage: number,
    fixedAmount: number,
    maxSalary: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
    hourlyRate: number = 0
  ): IJobCommission {
    if (type === "percentage") {
      const recruiterPercentage = this.calculateRecruiterCommission(
        originalPercentage,
        reductionPercentage
      );
      const platformFeePercentage = this.calculatePlatformFee(
        originalPercentage,
        recruiterPercentage
      );
      const originalAmount = this.calculateCommissionAmount(
        maxSalary,
        originalPercentage
      );
      const recruiterAmount = this.calculateCommissionAmount(
        maxSalary,
        recruiterPercentage
      );

      return {
        type: "percentage",
        originalPercentage,
        fixedAmount: 0,
        hourlyRate: 0,
        recruiterPercentage,
        platformFeePercentage,
        reductionPercentage,
        originalAmount,
        recruiterAmount,
      };
    } else if (type === "fixed") {
      // Fixed commission type
      const { recruiterAmount } = this.calculateFixedCommissionBreakdown(
        fixedAmount,
        reductionPercentage
      );

      return {
        type: "fixed",
        originalPercentage: 0,
        fixedAmount,
        hourlyRate: 0,
        recruiterPercentage: 0,
        platformFeePercentage: 0,
        reductionPercentage,
        originalAmount: fixedAmount,
        recruiterAmount,
      };
    } else {
      // Hourly commission type
      const { recruiterAmount } = this.calculateFixedCommissionBreakdown(
        hourlyRate,
        reductionPercentage
      );

      return {
        type: "hourly",
        originalPercentage: 0,
        fixedAmount: 0,
        hourlyRate,
        recruiterPercentage: 0,
        platformFeePercentage: 0,
        reductionPercentage,
        originalAmount: hourlyRate,
        recruiterAmount,
      };
    }
  }
}

// Create a unique job code if not provided
JobSchema.pre("save", async function (next) {
  if (this.isNew && !this.jobCode) {
    const date = new Date();
    this.jobCode = `JOB-${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date
      .getDate()
      .toString()
      .padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Handle commission calculation for new jobs or when commission data changes
  if (
    this.isNew ||
    this.isModified("commission") ||
    this.isModified("salary.max")
  ) {
    if (this.commission) {
      // Validate platform fee is within allowed range
      const reductionPercentage =
        this.commission.reductionPercentage ||
        COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE;
      if (
        reductionPercentage < COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE ||
        reductionPercentage > COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE
      ) {
        const error = new Error(
          `Platform fee must be between ${COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE}% and ${COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE}%`
        );
        error.name = "ValidationError";
        return next(error);
      }

      const commissionData = CommissionCalculator.createCommissionStructure(
        this.commission.type || "percentage",
        this.commission.originalPercentage || 0,
        this.commission.fixedAmount || 0,
        this.salary?.max || 0,
        reductionPercentage,
        this.commission.hourlyRate || 0
      );
      this.commission = commissionData;

      // Update legacy fields for backward compatibility
      this.commissionPercentage =
        this.commission.type === "percentage"
          ? this.commission.originalPercentage
          : 0;
      this.commissionAmount = this.commission.originalAmount;
    }
  }

  next();
});

// Use modelName to avoid issues with hot reloading
const Job = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export default Job;
