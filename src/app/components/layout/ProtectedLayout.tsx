'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/app/store/index';
// import { UserRole } from '../../../constants/userRoles';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles: string[];
  useDashboardLayout?: boolean;
}

export default function ProtectedLayout({ 
  children, 
  allowedRoles,
  useDashboardLayout = false
}: ProtectedLayoutProps) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If user doesn't have required role, redirect appropriately
    if (user && !allowedRoles.includes(user.role)) {
      // Redirect based on user role
      switch (user.role) {
        case 'COMPANY':
          router.push('/dashboard/company');
          break;
        case 'RECRUITER':
          router.push('/dashboard/recruiter');
          break;
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'INTERNAL':
          router.push('/dashboard/internal');
          break;
        default:
          router.push('/');
      }
    }
  }, [isAuthenticated, user, router, allowedRoles]);

  // Prevent hydration mismatch by only rendering after client-side hydration
  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user has required role, render the children
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Fallback while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <p>You don't have permission to access this page. Redirecting...</p>
      </div>
    </div>
  );
}