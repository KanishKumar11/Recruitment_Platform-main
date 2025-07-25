// src/app/models/ScreeningQuestion.ts
import mongoose, { Schema, Document } from 'mongoose';
import { QuestionType } from '../types/ScreeningQuestionTypes';

export interface IScreeningQuestion extends Document {
  jobId: mongoose.Types.ObjectId;
  question: string;
  questionType: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningQuestionSchema = new Schema<IScreeningQuestion>(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    question: { type: String, required: true },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true
    },
    options: {
      type: [String],
      required: function() {
        return ['MULTIPLE_CHOICE', 'CHECKBOX'].includes(this.questionType);
      }
    },
    required: { type: Boolean, default: false },
    order: { type: Number, required: false }
  },
  { timestamps: true }
);

// Ensure the model is registered correctly using modelName
const ScreeningQuestion = mongoose.models.ScreeningQuestion || 
  mongoose.model<IScreeningQuestion>('ScreeningQuestion', ScreeningQuestionSchema);

export default ScreeningQuestion;