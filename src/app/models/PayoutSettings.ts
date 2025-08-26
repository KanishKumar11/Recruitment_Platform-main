//src/app/models/PayoutSettings.ts
import mongoose, { Schema, Document } from "mongoose";

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  PAYPAL = "PAYPAL",
  WISE = "WISE",
  VEEM = "VEEM",
}

export interface IBankTransferDetails {
  accountHolderName: string;
  bankName: string;
  branchIfscSortCode: string;
  accountNumberIban: string;
  swiftBicCode?: string;
  internalTransferIdReference?: string;
}

export interface IPayPalDetails {
  paypalEmail: string;
}

export interface IWiseDetails {
  registeredEmailOrAccountId: string;
}

export interface IVeemDetails {
  veemAccountEmailOrBusinessId: string;
}

export interface IPayoutSettings extends Document {
  userId: mongoose.Types.ObjectId;
  preferredPaymentMethod: PaymentMethod;
  
  // Payment method details
  bankTransferDetails?: IBankTransferDetails;
  paypalDetails?: IPayPalDetails;
  wiseDetails?: IWiseDetails;
  veemDetails?: IVeemDetails;
  
  // Security and audit
  isActive: boolean;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const BankTransferDetailsSchema = new Schema<IBankTransferDetails>({
  accountHolderName: { type: String, required: true },
  bankName: { type: String, required: true },
  branchIfscSortCode: { type: String, required: true },
  accountNumberIban: { type: String, required: true },
  swiftBicCode: { type: String, required: false },
  internalTransferIdReference: { type: String, required: false },
}, { _id: false });

const PayPalDetailsSchema = new Schema<IPayPalDetails>({
  paypalEmail: { type: String, required: true },
}, { _id: false });

const WiseDetailsSchema = new Schema<IWiseDetails>({
  registeredEmailOrAccountId: { type: String, required: true },
}, { _id: false });

const VeemDetailsSchema = new Schema<IVeemDetails>({
  veemAccountEmailOrBusinessId: { type: String, required: true },
}, { _id: false });

const PayoutSettingsSchema = new Schema<IPayoutSettings>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user can have only one payout setting
    },
    preferredPaymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    bankTransferDetails: {
      type: BankTransferDetailsSchema,
      required: false,
    },
    paypalDetails: {
      type: PayPalDetailsSchema,
      required: false,
    },
    wiseDetails: {
      type: WiseDetailsSchema,
      required: false,
    },
    veemDetails: {
      type: VeemDetailsSchema,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
PayoutSettingsSchema.index({ userId: 1 });
PayoutSettingsSchema.index({ preferredPaymentMethod: 1 });

// Validation middleware to ensure the correct payment details are provided
PayoutSettingsSchema.pre("save", function (next) {
  const payoutSettings = this as IPayoutSettings;
  
  // Validate that the required payment details are provided based on preferred method
  switch (payoutSettings.preferredPaymentMethod) {
    case PaymentMethod.BANK_TRANSFER:
      if (!payoutSettings.bankTransferDetails) {
        return next(new Error("Bank transfer details are required for bank transfer payment method"));
      }
      break;
    case PaymentMethod.PAYPAL:
      if (!payoutSettings.paypalDetails) {
        return next(new Error("PayPal details are required for PayPal payment method"));
      }
      break;
    case PaymentMethod.WISE:
      if (!payoutSettings.wiseDetails) {
        return next(new Error("Wise details are required for Wise payment method"));
      }
      break;
    case PaymentMethod.VEEM:
      if (!payoutSettings.veemDetails) {
        return next(new Error("Veem details are required for Veem payment method"));
      }
      break;
  }
  
  next();
});

export default mongoose.models.PayoutSettings ||
  mongoose.model<IPayoutSettings>("PayoutSettings", PayoutSettingsSchema);