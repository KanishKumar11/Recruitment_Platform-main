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
  
  // Company-specific fields
  companySize?: string;
  designation?: string;

  recruitmentFirmName?: string;
  
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
    
    // Company-specific fields (optional, only for COMPANY role)
    companyName: { type: String, required: false },
    companySize: { type: String, required: false },
    designation: { type: String, required: false },

    recruitmentFirmName: { type: String, required: false }
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