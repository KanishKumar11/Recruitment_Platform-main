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
      enum: ['TEXT', 'NUMERIC', 'YES_NO', 'MCQ', 'MULTI_SELECT'],
      required: true
    },
    options: {
      type: [String],
      required: function() {
        return ['MCQ', 'MULTI_SELECT'].includes(this.questionType);
      }
    },
    required: { type: Boolean, default: false },
    order: { type: Number, required: false }
  },
  { timestamps: true }
);

// Debug: Log the enum values to ensure they're correct
console.log('QuestionType enum values:', Object.values(QuestionType));

// Ensure the model is registered correctly using modelName
// Delete the existing model if it exists to force re-registration with updated schema
if (mongoose.models.ScreeningQuestion) {
  delete mongoose.models.ScreeningQuestion;
}

const ScreeningQuestion = mongoose.model<IScreeningQuestion>('ScreeningQuestion', ScreeningQuestionSchema);

export default ScreeningQuestion;