import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/app/lib/auth'; // Adjust the import path as necessary

// Define public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  // Add any other public routes here
  '/api/login',
  '/api/register',
  '/api/auth/login',
  '/api/auth/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is a public path
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico')
  );

  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // If the path is not public and there's no valid token, redirect to login
  if (!isPublicPath) {
    if (!token || !verifyToken(token)) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};