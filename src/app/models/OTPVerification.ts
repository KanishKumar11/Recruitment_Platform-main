// src/models/OTPVerification.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOTPVerification extends Document {
  email: string;
  otp: string;
  userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    // Company-specific fields (optional)
    companyName?: string;
    companySize?: string;
    designation?: string;

    recruitmentFirmName?: string; // Added for recruiter role
  };
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const OTPVerificationSchema = new Schema<IOTPVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  userData: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    // Company-specific fields (optional)
    companyName: { type: String, required: false },
    companySize: { type: String, required: false },
    designation: { type: String, required: false },

    recruitmentFirmName: { type: String, required: false }, // Added for recruiter role
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Create index for automatic document expiration
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create index for email lookup
OTPVerificationSchema.index({ email: 1 });

const OTPVerification = mongoose.models.OTPVerification || mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);

export default OTPVerification;