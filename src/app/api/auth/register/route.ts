import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import User, { UserRole } from './../../../models/User';
import { generateToken } from './../../../lib/auth';
import { isValidPhoneNumber } from 'libphonenumber-js';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { name, email, password, phone, role } = await req.json();

    console.log(`Registration attempt for email: ${email}`);

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

    // Company email validation for COMPANY role
    if (role === UserRole.COMPANY) {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role,
      isPrimary: true,
    });

    await user.save();

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
    };

    console.log(`User registered successfully: ${email}`);

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}