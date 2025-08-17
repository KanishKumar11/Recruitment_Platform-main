// src/app/api/auth/reset-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import connectDb from './../../../lib/db';
import User from './../../../models/User';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPasswordResetConfirmationEmail } from './../../../lib/emailService';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { token, password } = await req.json();
    
    console.log(`Password reset attempt with token`);

    // Validate input
    if (!token || !password) {
      console.log('Missing token or password');
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log(`Account deactivated for user: ${user.email}`);
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Save the user
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    // Send password reset confirmation email
    try {
      await sendPasswordResetConfirmationEmail(user.email, user.name);
      console.log(`Password reset confirmation email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the request if confirmation email fails
    }

    return NextResponse.json({
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}