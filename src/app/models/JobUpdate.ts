// src/app/models/JobUpdate.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IJobUpdate extends Document {
  jobId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  postedBy: mongoose.Types.ObjectId;
  postedByName: string;
  postedByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobUpdateSchema = new Schema<IJobUpdate>(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    postedByRole: {
      type: String,
      required: true,
      enum: ["ADMIN", "INTERNAL", "COMPANY"],
    },
  },
  { timestamps: true }
);

// Index for efficient queries
JobUpdateSchema.index({ jobId: 1, createdAt: -1 });
JobUpdateSchema.index({ postedBy: 1 });

const JobUpdate = mongoose.models.JobUpdate || mongoose.model<IJobUpdate>("JobUpdate", JobUpdateSchema);

export default JobUpdate;