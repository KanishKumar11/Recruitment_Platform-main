// src/app/api/auth/login/route.ts
import { NextResponse, NextRequest } from 'next/server';
import connectDb from './../../../lib/db';
import User from './../../../models/User';
import { generateToken } from './../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email, password } = await req.json();
    
    console.log(`Login attempt for email: ${email}`);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Invalid password for user: ${email}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log(`Account deactivated for user: ${email}`);
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPrimary: user.isPrimary,
      isActive: user.isActive,
    };

    console.log(`User logged in successfully: ${email}`);

    const response = NextResponse.json({
      user: userData,
      token,
    });
    
    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}