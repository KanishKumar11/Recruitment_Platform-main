import mongoose, { Document, Schema } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  order: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
FAQSchema.index({ category: 1, order: 1, isActive: 1 });
FAQSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);
