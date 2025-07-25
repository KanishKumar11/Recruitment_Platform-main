import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  console.log('User logged out successfully');
  return response;
}