//src/app/dashboard/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../../store/index";
import { Suspense } from "react";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useChangeUserPasswordMutation,
} from "../../../store/services/adminApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";

function AdminUsersContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get query parameters
  const roleParam = searchParams.get("role");
  const isPrimaryParam = searchParams.get("isPrimary");
  const isActiveParam = searchParams.get("isActive");
  const pageParam = searchParams.get("page");

  // Set filter state - default to showing active users
  const [filters, setFilters] = useState<{
    role: UserRole | undefined;
    isPrimary: boolean | undefined;
    isActive: boolean | undefined;
    search: string;
    page: number;
    limit: number;
  }>({
    role: roleParam as UserRole | undefined,
    isPrimary: isPrimaryParam ? isPrimaryParam === "true" : undefined,
    isActive: isActiveParam ? isActiveParam === "true" : true, // Default to active users
    search: '',
    page: pageParam ? parseInt(pageParam) : 1,
    limit: 10,
  });

  // API call to get users with filters
  const { data, isLoading, refetch } = useGetUsersQuery({
    role: filters.role,
    isPrimary: filters.isPrimary,
    isActive: filters.isActive, // Include isActive in the query
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
  });

  // Delete user mutation
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Toggle user status mutation
  const [toggleUserStatus, { isLoading: isToggling }] =
    useToggleUserStatusMutation();

  const [changeUserPassword, { isLoading: isChangingPassword }] =
    useChangeUserPasswordMutation();

  // Password change modal state
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: '', userName: '' });
  const [newPassword, setNewPassword] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (filters.isPrimary !== undefined)
      params.set("isPrimary", filters.isPrimary.toString());
    if (filters.isActive !== undefined)
      params.set("isActive", filters.isActive.toString());
    if (filters.page !== 1) params.set("page", filters.page.toString());

    const queryString = params.toString();
    router.push(
      `/dashboard/admin/users${queryString ? `?${queryString}` : ""}`
    );
  }, [filters, router]);

  // Handle filter changes
  const handleRoleFilter = (role?: UserRole) => {
    setFilters((prev) => ({ ...prev, role, page: 1 }));
  };

  const handlePrimaryFilter = (isPrimary?: boolean) => {
    setFilters((prev) => ({ ...prev, isPrimary, page: 1 }));
  };

  const handleActiveFilter = (isActive?: boolean) => {
    setFilters((prev) => ({ ...prev, isActive, page: 1 }));
  };

  const handleSearchFilter = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await deleteUser(userId).unwrap();
        toast.success("User deleted successfully");
        refetch();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  // Handle user status toggle (activate/deactivate)
  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
    userName: string
  ) => {
    const action = currentStatus ? "deactivate" : "activate";
    const confirmMessage = `Are you sure you want to ${action} ${userName}? ${
      !currentStatus
        ? "They will regain access to their account."
        : "They will no longer be able to log in."
    }`;

    if (window.confirm(confirmMessage)) {
      try {
        await toggleUserStatus({
          id: userId,
          isActive: !currentStatus,
        }).unwrap();
        toast.success(`User ${action}d successfully`);
        refetch();
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await changeUserPassword({
        id: passwordModal.userId,
        newPassword,
      }).unwrap();
      toast.success(`Password changed successfully for ${passwordModal.userName}`);
      setPasswordModal({ isOpen: false, userId: '', userName: '' });
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  // Open password change modal
  const openPasswordModal = (userId: string, userName: string) => {
    setPasswordModal({ isOpen: true, userId, userName });
    setNewPassword('');
  };

  // Function to get badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "INTERNAL":
        return "bg-yellow-100 text-yellow-800";
      case "COMPANY":
        return "bg-blue-100 text-blue-800";
      case "RECRUITER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const renderPagination = () => {
    if (!data?.pagination) return null;

    const { page, pages } = data.pagination;
    const pageNumbers = [];

    // Create array of page numbers to display
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page, last page, and pages around current
      if (page <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push(null); // Separator
        pageNumbers.push(pages);
      } else if (page >= pages - 2) {
        // Near end
        pageNumbers.push(1);
        pageNumbers.push(null); // Separator
        for (let i = pages - 4; i <= pages; i++) pageNumbers.push(i);
      } else {
        // Middle
        pageNumbers.push(1);
        pageNumbers.push(null); // Separator
        for (let i = page - 1; i <= page + 1; i++) pageNumbers.push(i);
        pageNumbers.push(null); // Separator
        pageNumbers.push(pages);
      }
    }

    return (
      <div className="flex items-center justify-center mt-6">
        <nav
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          aria-label="Pagination"
        >
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
              page === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          {pageNumbers.map((pageNum, index) =>
            pageNum === null ? (
              <span
                key={`ellipsis-${index}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageChange(pageNum as number)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNum === page
                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pages}
            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
              page === pages
                ? "text-gray-300"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                User Management
              </h1>
              <div className="space-x-2">
                <Link
                  href="/dashboard/admin/internal/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Internal Team Member
                </Link>
                <Link
                  href="/dashboard/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Filter Users
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div>
                    <label
                      htmlFor="search-filter"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Search Users
                    </label>
                    <input
                      type="text"
                      id="search-filter"
                      placeholder="Search by name or email..."
                      value={filters.search}
                      onChange={(e) => handleSearchFilter(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="role-filter"
                      className="block text-sm font-medium text-gray-700"
                    >
                      User Role
                    </label>
                    <select
                      id="role-filter"
                      value={filters.role || ""}
                      onChange={(e) =>
                        handleRoleFilter(
                          e.target.value
                            ? (e.target.value as UserRole)
                            : undefined
                        )
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Roles</option>
                      <option value={UserRole.COMPANY}>Company</option>
                      <option value={UserRole.RECRUITER}>Recruiter</option>
                      <option value={UserRole.INTERNAL}>Internal Team</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="primary-filter"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Account Type
                    </label>
                    <select
                      id="primary-filter"
                      value={
                        filters.isPrimary === undefined
                          ? ""
                          : filters.isPrimary.toString()
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        handlePrimaryFilter(
                          val === "" ? undefined : val === "true"
                        );
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Types</option>
                      <option value="true">Primary Accounts</option>
                      <option value="false">Team Members</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="status-filter"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>
                    <select
                      id="status-filter"
                      value={
                        filters.isActive === undefined
                          ? ""
                          : filters.isActive.toString()
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        handleActiveFilter(
                          val === "" ? undefined : val === "true"
                        );
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="true">Active Users</option>
                      <option value="false">Inactive Users</option>
                      <option value="">All Users</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() =>
                        setFilters({
                          role: undefined,
                          isPrimary: undefined,
                          isActive: true, // Reset to active by default
                          search: '',
                          page: 1,
                          limit: 10,
                        })
                      }
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Users
                  {data?.pagination && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({data.pagination.total} total)
                    </span>
                  )}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Organisation
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Joined
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.users && data.users.length > 0 ? (
                      data.users.map((user) => (
                        <tr
                          key={user._id as string}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.isPrimary
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.isPrimary ? "Primary" : "Team Member"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.recruitmentFirmName ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                {user.recruitmentFirmName}
                              </span>
                            ) : user.companyName ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                {user.companyName}
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Individual
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                                user.isActive
                              )}`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{user.email}</div>
                            <div>{user.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                href={`/dashboard/admin/users/${user._id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                              <Link
                                href={`/dashboard/admin/users/${user._id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() =>
                                  openPasswordModal(user._id as string, user.name)
                                }
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Change Password
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleUserStatus(
                                    user._id as string,
                                    user.isActive,
                                    user.name
                                  )
                                }
                                disabled={isToggling || user.role === "ADMIN"}
                                className={`${
                                  user.role === "ADMIN"
                                    ? "text-gray-400 cursor-not-allowed"
                                    : user.isActive
                                    ? "text-orange-600 hover:text-orange-900"
                                    : "text-green-600 hover:text-green-900"
                                }`}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteUser(user._id as string)
                                }
                                disabled={isDeleting || user.role === "ADMIN"}
                                className={`${
                                  user.role === "ADMIN"
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-900"
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {renderPagination()}
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {passwordModal.isOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Password for {passwordModal.userName}
                </h3>
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setPasswordModal({ isOpen: false, userId: '', userName: '' });
                      setNewPassword('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !newPassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
