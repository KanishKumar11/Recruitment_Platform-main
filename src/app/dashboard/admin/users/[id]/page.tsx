//src/app/dashboard/admin/users/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ProtectedLayout from '@/app/components/layout/ProtectedLayout';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { useGetUserByIdQuery, useDeleteUserMutation } from '../../../../store/services/usersApi';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const { data: user, isLoading, error } = useGetUserByIdQuery(userId);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      toast.success('User deleted successfully');
      router.push('/dashboard/admin/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'COMPANY':
        return 'bg-blue-100 text-blue-800';
      case 'RECRUITER':
        return 'bg-purple-100 text-purple-800';
      case 'INTERNAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={['ADMIN']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (error || !user) {
    return (
      <ProtectedLayout allowedRoles={['ADMIN']}>
        <DashboardLayout>
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-red-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">
                Failed to load user data. The user may not exist or you may not have permission to view it.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/users"
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Return to users list
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">User Details</h1>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/admin/users/${userId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit User
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Users
              </Link>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {user.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  User ID: {userId}
                </p>
              </div>
              <div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                {' '}
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isPrimary ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {user.isPrimary ? 'Primary' : 'Team Member'}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Phone number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.phone}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Role
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.role}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Account type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.isPrimary ? 'Primary Account' : 'Team Member'}
                  </dd>
                </div>
                {user.parentId && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Parent Account
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <Link 
                        href={`/dashboard/admin/users/${user.parentId}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View parent account
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Created at
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(user.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Last updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(user.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-red-900">
                  Delete User
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    Once you delete this user, there is no going back. This action cannot be undone.
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    >
                      Delete User
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700 mb-4">
                      Are you sure you want to delete this user? This action cannot be undone.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete User'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}