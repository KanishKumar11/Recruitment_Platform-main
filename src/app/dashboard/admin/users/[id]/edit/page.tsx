//src/app/dashboard/admin/users/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ProtectedLayout from '@/app/components/layout/ProtectedLayout';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { UserRole } from '@/app/constants/userRoles';
import { useGetUserByIdQuery, useUpdateUserMutation } from '../../../../../store/services/usersApi';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const { data: user, isLoading, error } = useGetUserByIdQuery(userId);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    isPrimary: false,
    password: '', // For optional password reset
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        isPrimary: user.isPrimary || false,
        password: '', // Empty by default for password field
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateUser({ 
        id: userId,
        userData: { ...formData, role: formData.role as UserRole }
      }).unwrap();
      
      toast.success('User updated successfully');
      router.push('/dashboard/admin/users');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
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
            <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/admin/users/${userId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Details
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Users
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value={UserRole.COMPANY}>Company</option>
                      <option value={UserRole.RECRUITER}>Recruiter</option>
                      <option value={UserRole.INTERNAL}>Internal</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center">
                      <input
                        id="isPrimary"
                        name="isPrimary"
                        type="checkbox"
                        checked={formData.isPrimary}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-900">
                        Primary account (vs team member)
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Primary accounts can manage team members and have full access to their role features.
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Only fill this if you want to reset the user's password.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    href="/dashboard/admin/users"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}