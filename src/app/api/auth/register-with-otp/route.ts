// src/app/api/auth/register-with-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import User, { UserRole } from './../../../models/User';
import OTPVerification from './../../../models/OTPVerification';
import { sendOTPEmail } from './../../../lib/emailService';
import { isValidPhoneNumber } from 'libphonenumber-js';
import bcrypt from 'bcryptjs';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { name, email, password, phone, role, companyName, companySize, designation, recruitmentFirmName  } = await req.json();

    console.log(`Registration with OTP attempt for email: ${email}`);
    console.log('Received payload:', { name, email, phone, role, companyName, companySize, designation, recruitmentFirmName });

    // Validate input
    if (!name || !email || !password || !phone || !role) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(role as UserRole)) {
      console.log(`Invalid role: ${role}`);
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate phone number format
    try {
      if (!isValidPhoneNumber(phone)) {
        console.log(`Invalid phone number format: ${phone}`);
        return NextResponse.json(
          { error: 'Please provide a valid phone number with country code' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.log(`Phone number validation error: ${error}`);
      return NextResponse.json(
        { error: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }

    // Company-specific validation
    if (role === UserRole.COMPANY) {
      if (!companyName || !companySize || !designation) {
        console.log('Missing company-specific fields');
        return NextResponse.json(
          { error: 'Company name, company size, and designation are required for company registration' },
          { status: 400 }
        );
      }

      // Company email validation for COMPANY role
      const personalEmailDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'live.com',
        'aol.com',
        'icloud.com',
        'protonmail.com',
        'yandex.com',
        'mail.com',
        'rediffmail.com'
      ];

      const domain = email.split('@')[1]?.toLowerCase();
      if (personalEmailDomains.includes(domain)) {
        console.log(`Personal email domain not allowed for company registration: ${domain}`);
        return NextResponse.json(
          { error: 'Company email required. Personal email domains (gmail.com, yahoo.com, etc.) are not allowed for company registration.' },
          { status: 400 }
        );
      }
    }

    // Recruiter-specific validation
    if (role === UserRole.RECRUITER && recruitmentFirmName && !recruitmentFirmName.trim()) {
      console.log('Empty recruitment firm name provided');
      return NextResponse.json(
        { error: 'Recruitment firm name cannot be empty if provided' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return NextResponse.json(
        { error: 'User already exists with this email address' },
        { status: 409 }
      );
    }

    // Check if there's already a pending OTP verification for this email
    const existingOTP = await OTPVerification.findOne({ 
      email, 
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingOTP) {
      // If OTP was sent less than 60 seconds ago, prevent spam
      const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
      if (timeSinceLastOTP < 60000) { // 60 seconds
        return NextResponse.json(
          { error: 'Please wait before requesting another OTP' },
          { status: 429 }
        );
      }
      
      // Delete existing OTP verification
      await OTPVerification.deleteOne({ _id: existingOTP._id });
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Prepare user data object - Fixed to properly handle recruitmentFirmName
    const userData: any = {
      name,
      email,
      password, // Store plain password, let User model hash it
      phone,
      role,
    };

    // Add company-specific fields
    if (role === UserRole.COMPANY) {
      userData.companyName = companyName;
      userData.companySize = companySize;
      userData.designation = designation;
    }

    // Add recruiter-specific fields - Fixed logic
    if (role === UserRole.RECRUITER && recruitmentFirmName) {
      userData.recruitmentFirmName = recruitmentFirmName.trim();
      console.log(`Adding recruitment firm name to userData: ${userData.recruitmentFirmName}`);
    }

    console.log('Final userData to be stored:', userData);

    // Create OTP verification record
    const otpVerification = new OTPVerification({
      email,
      otp: hashedOTP,
      userData,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false,
      attempts: 0,
    });

    await otpVerification.save();
    console.log('OTP verification record saved with userData:', otpVerification.userData);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, name, otp);
    
    if (!emailSent) {
      // Clean up if email sending failed
      await OTPVerification.deleteOne({ _id: otpVerification._id });
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`OTP sent successfully to: ${email}`);

    return NextResponse.json({
      message: 'Verification code sent to your email address',
      email: email,
      expiresIn: 600, // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Registration with OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}