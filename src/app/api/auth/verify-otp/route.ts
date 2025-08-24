// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "./../../../lib/db";
import User, { UserRole } from "./../../../models/User";
import OTPVerification from "./../../../models/OTPVerification";
import { generateToken } from "./../../../lib/auth";
import { sendWelcomeEmail, sendRecruiterWelcomeEmail } from "./../../../lib/emailService";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email, otp } = await req.json();

    console.log(`OTP verification attempt for email: ${email}`);

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find OTP verification record
    const otpRecord = await OTPVerification.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      console.log(`No valid OTP found for email: ${email}`);
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    console.log('Retrieved OTP record userData:', otpRecord.userData);

    // Check if maximum attempts reached
    if (otpRecord.attempts >= 5) {
      console.log(`Maximum OTP attempts reached for email: ${email}`);
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        {
          error:
            "Maximum verification attempts reached. Please request a new code.",
        },
        { status: 429 }
      );
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOTPValid) {
      // Increment attempts
      await OTPVerification.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } }
      );

      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      console.log(
        `Invalid OTP for email: ${email}, remaining attempts: ${remainingAttempts}`
      );

      return NextResponse.json(
        {
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "User already exists with this email address" },
        { status: 409 }
      );
    }

    // Create user with the stored data INCLUDING all role-specific fields
    const userData = otpRecord.userData;
    console.log(`Creating user with complete userData: ${JSON.stringify(userData)}`);
    
    // Build user object with all fields
    const userCreateData: any = {
      name: userData.name,
      email: userData.email,
      password: userData.password, // Plain password - will be hashed by pre-save middleware
      phone: userData.phone,
      role: userData.role,
      isPrimary: true,
      emailVerified: true, // Mark as verified since OTP was successful
      emailVerifiedAt: new Date(),
    };

    // Add company-specific fields if role is COMPANY
    if (userData.role === UserRole.COMPANY) {
      userCreateData.companyName = userData.companyName;
      userCreateData.companySize = userData.companySize;
      userCreateData.designation = userData.designation;
      console.log('Adding company fields to user creation:', {
        companyName: userData.companyName,
        companySize: userData.companySize,
        designation: userData.designation
      });
    }

    // Add recruiter-specific fields if role is RECRUITER - FIXED
    if (userData.role === UserRole.RECRUITER && userData.recruitmentFirmName) {
      userCreateData.recruitmentFirmName = userData.recruitmentFirmName;
      console.log('Adding recruitment firm field to user creation:', {
        recruitmentFirmName: userData.recruitmentFirmName
      });
    }

    console.log('Final user creation data:', userCreateData);

    // Create the user
    const user = new User(userCreateData);
    await user.save();

    // Log successful creation with all details
    console.log(`User registered and verified successfully: ${email}`);
    console.log(`User saved with role: ${user.role}`);
    
    if (user.role === UserRole.COMPANY) {
      console.log(`Company details saved - Name: ${user.companyName}, Size: ${user.companySize}, Designation: ${user.designation}`);
    }
    
    if (user.role === UserRole.RECRUITER) {
      console.log(`Recruiter details - Firm Name: ${user.recruitmentFirmName || 'Individual'}`);
    }

    // Mark OTP as verified and clean up
    await OTPVerification.updateOne({ _id: otpRecord._id }, { verified: true });

    // Clean up - delete the OTP record
    await OTPVerification.deleteOne({ _id: otpRecord._id });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Build response user data - FIXED: Properly include ALL role-specific fields
    const responseUserData: any = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPrimary: user.isPrimary,
      emailVerified: user.emailVerified,
    };

    // Add company-specific fields for COMPANY role
    if (user.role === UserRole.COMPANY) {
      responseUserData.companyName = user.companyName;
      responseUserData.companySize = user.companySize;
      responseUserData.designation = user.designation;
      
      console.log('Response includes company data:', {
        companyName: user.companyName,
        companySize: user.companySize,
        designation: user.designation
      });
    }

    // Add recruiter-specific fields for RECRUITER role - FIXED
    if (user.role === UserRole.RECRUITER) {
      // Always include recruitmentFirmName field, even if null/undefined
      responseUserData.recruitmentFirmName = user.recruitmentFirmName || null;
      
      console.log('Response includes recruiter data:', {
        recruitmentFirmName: user.recruitmentFirmName
      });
    }

    console.log('Final response user data:', responseUserData);

    // Send welcome email based on user role (don't wait for it)
    if (user.role === UserRole.RECRUITER) {
      sendRecruiterWelcomeEmail(user.email, user.name).catch((error) => {
        console.error("Failed to send recruiter welcome email:", error);
      });
    } else {
      sendWelcomeEmail(user.email, user.name).catch((error) => {
        console.error("Failed to send welcome email:", error);
      });
    }

    const response = NextResponse.json({
      message: "Account created and verified successfully",
      user: responseUserData,
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}