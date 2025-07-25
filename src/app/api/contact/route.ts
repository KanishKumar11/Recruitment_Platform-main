// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/app/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, company, message } = await req.json();

    console.log(`Contact form submission from: ${email}`);
    console.log('Form data:', { name, email, phone, company, message });

    // Validate input
    if (!name || !email || !phone || !message) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Name, email, phone, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Send contact form email
    const emailSent = await sendContactFormEmail({
      name,
      email,
      phone,
      company: company || 'Not provided',
      message
    });
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send your message. Please try again later.' },
        { status: 500 }
      );
    }

    console.log(`Contact form email sent successfully from: ${email}`);

    return NextResponse.json({
      message: 'Your message has been sent successfully! We will get back to you soon.',
      success: true
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}