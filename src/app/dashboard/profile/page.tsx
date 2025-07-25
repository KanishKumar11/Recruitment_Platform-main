'use client';

import { useSelector } from 'react-redux';
import { RootState } from './../../store/index';
import ProtectedLayout from '@/app/components/layout/ProtectedLayout';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import UserProfile from '@/app/components/UserProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?from=/dashboard/profile');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['COMPANY', 'RECRUITER', 'ADMIN', 'INTERNAL']}>
      <DashboardLayout>
        <div className="py-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-200 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your account information and security settings</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.028-.696-.083-1.033A4.96 4.96 0 0110 11z" clipRule="evenodd" />
                  </svg>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <UserProfile />
          </div>
          
          
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}