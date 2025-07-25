import mongoose from "mongoose";
import { JobStatus } from "./jobStatus";

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP'
}

export interface IJob {
  title: string;
  jobCode: string;
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
  paymentTerms: string;
  positions: number;
  jobType: JobType;
  experienceLevel: {
    min: number;
    max: number;
  };
  compensationDetails: string;
  replacementTerms: string;
  commissionPercentage: number;
  commissionAmount: number;
  fixedCommissionAmount: number; // New fixed commission field
  description: string;
  sourcingGuidelines: string;
  screeningQuestions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  postedByName?: string;
  
  // Add company field
  company?: {
    _id: string;
    name: string;
    // add other company fields you need
  };
}