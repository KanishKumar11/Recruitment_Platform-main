//src/app/api/recruiter/payout-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/app/lib/db";
import User, { UserRole } from "@/app/models/User";
import PayoutSettings, { PaymentMethod } from "@/app/models/PayoutSettings";

// Rate limiting map to track requests per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per window

// GET - Retrieve payout settings for the authenticated recruiter
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payoutSettings = await PayoutSettings.findOne({ userId: user._id });

    return NextResponse.json({
      success: true,
      data: payoutSettings,
    });
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update payout settings for the authenticated recruiter
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    // Rate limiting check
    const userId = decoded.userId;
    const now = Date.now();
    const userRateLimit = rateLimitMap.get(userId);
    
    if (userRateLimit) {
      if (now < userRateLimit.resetTime) {
        if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          );
        }
        userRateLimit.count++;
      } else {
        // Reset the rate limit window
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      // First request from this user
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
    
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    
    // Input sanitization function
    const sanitizeString = (str: string) => {
      if (typeof str !== 'string') return '';
      return str.trim().replace(/[<>"'&]/g, '');
    };
    
    // Email validation function
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    
    const {
      preferredPaymentMethod,
      bankTransferDetails,
      paypalDetails,
      wiseDetails,
      veemDetails,
    } = body;

    // Validate required fields
    if (!preferredPaymentMethod || !Object.values(PaymentMethod).includes(preferredPaymentMethod)) {
      return NextResponse.json(
        { error: "Valid preferred payment method is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize payment method specific details
    switch (preferredPaymentMethod) {
      case PaymentMethod.BANK_TRANSFER:
        if (!bankTransferDetails?.accountHolderName || !bankTransferDetails?.bankName || 
            !bankTransferDetails?.branchIfscSortCode || !bankTransferDetails?.accountNumberIban) {
          return NextResponse.json(
            { error: "Complete bank transfer details are required" },
            { status: 400 }
          );
        }
        // Sanitize bank transfer details
        bankTransferDetails.accountHolderName = sanitizeString(bankTransferDetails.accountHolderName);
        bankTransferDetails.bankName = sanitizeString(bankTransferDetails.bankName);
        bankTransferDetails.branchIfscSortCode = sanitizeString(bankTransferDetails.branchIfscSortCode);
        bankTransferDetails.accountNumberIban = sanitizeString(bankTransferDetails.accountNumberIban);
        if (bankTransferDetails.swiftBicCode) {
          bankTransferDetails.swiftBicCode = sanitizeString(bankTransferDetails.swiftBicCode);
        }
        if (bankTransferDetails.internalTransferIdOrReference) {
          bankTransferDetails.internalTransferIdOrReference = sanitizeString(bankTransferDetails.internalTransferIdOrReference);
        }
        break;
      case PaymentMethod.PAYPAL:
        if (!paypalDetails?.paypalEmail || !isValidEmail(paypalDetails.paypalEmail)) {
          return NextResponse.json(
            { error: "Valid PayPal email is required" },
            { status: 400 }
          );
        }
        paypalDetails.paypalEmail = sanitizeString(paypalDetails.paypalEmail);
        break;
      case PaymentMethod.WISE:
        if (!wiseDetails?.registeredEmailOrAccountId) {
          return NextResponse.json(
            { error: "Wise email or account ID is required" },
            { status: 400 }
          );
        }
        // Validate email if it looks like an email
        if (wiseDetails.registeredEmailOrAccountId.includes('@') && 
            !isValidEmail(wiseDetails.registeredEmailOrAccountId)) {
          return NextResponse.json(
            { error: "Valid Wise email is required" },
            { status: 400 }
          );
        }
        wiseDetails.registeredEmailOrAccountId = sanitizeString(wiseDetails.registeredEmailOrAccountId);
        break;
      case PaymentMethod.VEEM:
        if (!veemDetails?.veemAccountEmailOrBusinessId) {
          return NextResponse.json(
            { error: "Veem account email or business ID is required" },
            { status: 400 }
          );
        }
        // Validate email if it looks like an email
        if (veemDetails.veemAccountEmailOrBusinessId.includes('@') && 
            !isValidEmail(veemDetails.veemAccountEmailOrBusinessId)) {
          return NextResponse.json(
            { error: "Valid Veem email is required" },
            { status: 400 }
          );
        }
        veemDetails.veemAccountEmailOrBusinessId = sanitizeString(veemDetails.veemAccountEmailOrBusinessId);
        break;
    }

    // Create or update payout settings
    const payoutSettingsData = {
      userId: user._id,
      preferredPaymentMethod,
      bankTransferDetails: preferredPaymentMethod === PaymentMethod.BANK_TRANSFER ? bankTransferDetails : undefined,
      paypalDetails: preferredPaymentMethod === PaymentMethod.PAYPAL ? paypalDetails : undefined,
      wiseDetails: preferredPaymentMethod === PaymentMethod.WISE ? wiseDetails : undefined,
      veemDetails: preferredPaymentMethod === PaymentMethod.VEEM ? veemDetails : undefined,
      lastUpdatedBy: user._id,
    };

    let payoutSettings;
    try {
      payoutSettings = await PayoutSettings.findOneAndUpdate(
        { userId: user._id },
        payoutSettingsData,
        { upsert: true, new: true, runValidators: true }
      );
    } catch (dbError) {
      console.error("Database error saving payout settings:", dbError);
      return NextResponse.json(
        { error: "Failed to save payout settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payout settings saved successfully",
      data: payoutSettings,
    });
  } catch (error) {
    console.error("Error saving payout settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove payout settings for the authenticated recruiter
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await PayoutSettings.findOneAndDelete({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Payout settings deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payout settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}