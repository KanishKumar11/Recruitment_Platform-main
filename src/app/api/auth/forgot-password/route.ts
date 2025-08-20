// src/app/api/auth/forgot-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import connectDb from './../../../lib/db';
import User from './../../../models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './../../../lib/emailService';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email } = await req.json();
    
    console.log(`Password reset request for email: ${email}`);

    // Validate input
    if (!email) {
      console.log('Missing email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.',
        email: email
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log(`Account deactivated for user: ${email}`);
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://sourcingscreen.com'}/reset-password?token=${resetToken}`;

    // Send password reset email using the existing email service
    try {
      const emailSent = await sendPasswordResetEmail(user.email, user.name, resetUrl);
      
      if (!emailSent) {
        // Clear the reset token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        return NextResponse.json(
          { error: 'Failed to send reset email. Please try again later.' },
          { status: 500 }
        );
      }

      console.log(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully. Please check your inbox.',
      email: email
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}