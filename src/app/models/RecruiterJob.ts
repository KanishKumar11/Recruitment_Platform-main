// src/app/models/RecruiterJob.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRecruiterJob extends Document {
  recruiterId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  addedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterJobSchema = new Schema<IRecruiterJob>(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create compound index to prevent duplicate entries
RecruiterJobSchema.index({ recruiterId: 1, jobId: 1 }, { unique: true });

// Index for efficient queries
RecruiterJobSchema.index({ recruiterId: 1, isActive: 1 });
RecruiterJobSchema.index({ jobId: 1 });

const RecruiterJob =
  mongoose.models.RecruiterJob ||
  mongoose.model<IRecruiterJob>("RecruiterJob", RecruiterJobSchema);

export default RecruiterJob;
