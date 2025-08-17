//src/app/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  COMPANY = 'COMPANY',
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN', 
  INTERNAL = 'INTERNAL'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyName?: string; // Add this field for company users
  isPrimary?: boolean; // For company hierarchy
  isActive: boolean;
  parentId?: mongoose.Types.ObjectId;
  
  // Email verification fields
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  
  // Password reset fields
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  
  // Company-specific fields
  companySize?: string;
  designation?: string;

  recruitmentFirmName?: string;
  
  // Recruiter-specific profile fields
  profilePicture?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  otherContactInfo?: string;
  country?: string;
  state?: string;
  city?: string;
  totalWorkExperience?: number;
  recruitmentExperience?: number;
  rolesClosedLastYear?: number;
  countriesWorkedIn?: string[];
  bio?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  otherSocialUrl?: string;
  geographiesCanHireIn?: string[];
  recruiterType?: string; // 'individual' or 'company'
  recruiterCompanyName?: string;
  recruiterDesignation?: string;
  recruiterCompanySize?: string;
  companyEstablishmentYears?: number;
  companyProfile?: string;
  resumeFileUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { 
      type: String, 
      enum: Object.values(UserRole), 
      required: true 
    },
    isPrimary: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    parentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: false
    },
    
    // Email verification fields
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, required: false },
    
    // Password reset fields
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    
    // Company-specific fields (optional, only for COMPANY role)
    companyName: { type: String, required: false },
    companySize: { type: String, required: false },
    designation: { type: String, required: false },

    recruitmentFirmName: { type: String, required: false },
    
    // Recruiter-specific profile fields (optional, only for RECRUITER role)
    profilePicture: { type: String, required: false },
    mobileNumber: { type: String, required: false },
    whatsappNumber: { type: String, required: false },
    otherContactInfo: { type: String, required: false },
    country: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false },
    totalWorkExperience: { type: Number, required: false, default: 0 },
    recruitmentExperience: { type: Number, required: false, default: 0 },
    rolesClosedLastYear: { type: Number, required: false, default: 0 },
    countriesWorkedIn: [{ type: String }],
    bio: { type: String, required: false },
    linkedinUrl: { type: String, required: false },
    facebookUrl: { type: String, required: false },
    otherSocialUrl: { type: String, required: false },
    geographiesCanHireIn: [{ type: String }],
    recruiterType: { type: String, enum: ['individual', 'company'], default: 'individual' },
    recruiterCompanyName: { type: String, required: false },
    recruiterDesignation: { type: String, required: false },
    recruiterCompanySize: { type: String, required: false },
    companyEstablishmentYears: { type: Number, required: false, default: 0 },
    companyProfile: { type: String, required: false },
    resumeFileUrl: { type: String, required: false }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);