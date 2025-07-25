// src/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import OTPVerification from './../../../models/OTPVerification';
import { sendOTPEmail } from './../../../lib/emailService';
import bcrypt from 'bcryptjs';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email } = await req.json();

    console.log(`Resend OTP request for email: ${email}`);

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find existing OTP verification record
    const existingOTP = await OTPVerification.findOne({
      email,
      verified: false,
    });

    if (!existingOTP) {
      console.log(`No pending verification found for email: ${email}`);
      return NextResponse.json(
        { error: 'No pending verification found. Please start registration again.' },
        { status: 404 }
      );
    }

    // Check rate limiting - prevent spam (60 seconds between requests)
    const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
    if (timeSinceLastOTP < 60000) { // 60 seconds
      const waitTime = Math.ceil((60000 - timeSinceLastOTP) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitTime} seconds before requesting another code` },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Update the existing record with new OTP and reset attempts
    await OTPVerification.updateOne(
      { _id: existingOTP._id },
      {
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        createdAt: new Date(),
      }
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, existingOTP.userData.name, otp);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`OTP resent successfully to: ${email}`);

    return NextResponse.json({
      message: 'New verification code sent to your email address',
      email: email,
      expiresIn: 600, // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}