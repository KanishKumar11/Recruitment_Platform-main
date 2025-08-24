//src/app/dashboard/admin/users/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import {
  useGetUserByIdQuery,
  useDeleteUserMutation,
} from "../../../../store/services/adminApi";
import { IUser } from "../../../../models/User";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useGetUserByIdQuery(userId);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<IUser | null>(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Handle resume viewing through secure API endpoint
  const handleResumeView = async (resumeFileUrl: string) => {
    if (!resumeFileUrl) return;

    // Clean the file path - remove leading slashes and path prefixes
    let filePath = resumeFileUrl.replace(/^\/+/, "");

    // If the path starts with 'uploads/', remove it since the API expects relative path
    if (filePath.startsWith("uploads/")) {
      filePath = filePath.replace("uploads/", "");
    }

    // If the path contains directory structure (like 'resumes/' or 'profiles/'),
    // extract just the filename for the /api/files endpoint
    if (filePath.includes("/")) {
      filePath = filePath.split("/").pop() || filePath;
    }

    // Use the secure API endpoint for file access
    const secureUrl = `/api/files/${filePath}`;

    try {
      // First, check if the file exists by making a HEAD request
      const response = await fetch(secureUrl, { method: "HEAD" });

      if (response.ok) {
        // File exists, open it in a new tab
        window.open(secureUrl, "_blank");
      } else if (response.status === 404) {
        // File not found, show user-friendly error
        toast.error(
          "Resume file not found. The file may have been moved or deleted."
        );
      } else if (response.status === 401) {
        // Authentication error
        toast.error(
          "You are not authorized to view this file. Please log in again."
        );
      } else {
        // Other errors
        toast.error(
          "Unable to access the resume file. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error accessing resume file:", error);
      toast.error("Network error while trying to access the resume file.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      toast.success("User deleted successfully");
      router.push("/dashboard/admin/users");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "COMPANY":
        return "bg-blue-100 text-blue-800";
      case "RECRUITER":
        return "bg-purple-100 text-purple-800";
      case "INTERNAL":
        return "bg-yellow-100 text-yellow-800";
      case "ADMIN":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  if (error || !user) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-red-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">
                Failed to load user data. The user may not exist or you may not
                have permission to view it.
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
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              User Details
            </h1>
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
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>{" "}
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isPrimary
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.isPrimary ? "Primary" : "Team Member"}
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
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.role}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Account type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.isPrimary ? "Primary Account" : "Team Member"}
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

                {/* Recruiter-specific fields */}
                {user.role === "RECRUITER" && (
                  <>
                    {/* Recruiter Profile Section */}
                    {(user.recruitmentFirmName ||
                      user.mobileNumber ||
                      user.whatsappNumber ||
                      user.otherContactInfo ||
                      user.profilePicture ||
                      user.resumeFileUrl) && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Recruiter Profile
                          </h4>
                        </div>
                        {user.profilePicture && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Profile Picture
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex items-center">
                                <img
                                  src={user.profilePicture}
                                  alt={`${user.name}'s profile`}
                                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                                <div className="hidden ml-4 text-gray-500 text-sm">
                                  Profile picture not available
                                </div>
                              </div>
                            </dd>
                          </div>
                        )}
                        {user.resumeFileUrl && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Resume/Company Profile
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() =>
                                    handleResumeView(user.resumeFileUrl!)
                                  }
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  View Resume/Profile
                                </button>
                                <span className="text-xs text-gray-500">
                                  {user.resumeFileUrl.split("/").pop()}
                                </span>
                              </div>
                            </dd>
                          </div>
                        )}
                        {user.recruitmentFirmName && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Recruitment Firm
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.recruitmentFirmName}
                            </dd>
                          </div>
                        )}
                        {user.mobileNumber && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Mobile Number
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.mobileNumber}
                            </dd>
                          </div>
                        )}
                        {user.whatsappNumber && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              WhatsApp Number
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.whatsappNumber}
                            </dd>
                          </div>
                        )}
                        {user.otherContactInfo && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Other Contact Info
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.otherContactInfo}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Location Section */}
                    {(user.country || user.state || user.city) && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Location
                          </h4>
                        </div>
                        {user.country && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Country
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.country}
                            </dd>
                          </div>
                        )}
                        {user.state && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              State
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.state}
                            </dd>
                          </div>
                        )}
                        {user.city && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              City
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.city}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Experience Section */}
                    {(user.totalWorkExperience ||
                      user.recruitmentExperience ||
                      user.rolesClosedLastYear) && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Experience
                          </h4>
                        </div>
                        {user.totalWorkExperience && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Total Work Experience
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.totalWorkExperience} years
                            </dd>
                          </div>
                        )}
                        {user.recruitmentExperience && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Recruitment Experience
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.recruitmentExperience} years
                            </dd>
                          </div>
                        )}
                        {user.rolesClosedLastYear && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Roles Closed Last Year
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.rolesClosedLastYear}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Bio Section */}
                    {user.bio && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Bio
                          </h4>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            About
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {user.bio}
                          </dd>
                        </div>
                      </>
                    )}

                    {/* Social Links Section */}
                    {(user.linkedinUrl ||
                      user.facebookUrl ||
                      user.otherSocialUrl) && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Social Links
                          </h4>
                        </div>
                        {user.linkedinUrl && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              LinkedIn
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <a
                                href={user.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {user.linkedinUrl}
                              </a>
                            </dd>
                          </div>
                        )}
                        {user.facebookUrl && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Facebook
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <a
                                href={user.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {user.facebookUrl}
                              </a>
                            </dd>
                          </div>
                        )}
                        {user.otherSocialUrl && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Other Social
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <a
                                href={user.otherSocialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {user.otherSocialUrl}
                              </a>
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Company Details Section - for company-type recruiters */}
                    {user.recruiterType === "company" &&
                      (user.recruiterCompanyName ||
                        user.recruiterDesignation ||
                        user.recruiterCompanySize ||
                        user.companyEstablishmentYears ||
                        user.companyProfile) && (
                        <>
                          <div className="bg-gray-50 px-4 py-3 sm:px-6">
                            <h4 className="text-md font-medium text-gray-900">
                              Company Details
                            </h4>
                          </div>
                          {user.recruiterCompanyName && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Company Name
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.recruiterCompanyName}
                              </dd>
                            </div>
                          )}
                          {user.recruiterDesignation && (
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Designation
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.recruiterDesignation}
                              </dd>
                            </div>
                          )}
                          {user.recruiterCompanySize && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Company Size
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.recruiterCompanySize}
                              </dd>
                            </div>
                          )}
                          {user.companyEstablishmentYears && (
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Years Established
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.companyEstablishmentYears} years
                              </dd>
                            </div>
                          )}
                          {user.companyProfile && (
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Company Profile
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.companyProfile}
                              </dd>
                            </div>
                          )}
                        </>
                      )}

                    {/* Additional Arrays - Countries and Geographies */}
                    {((user.countriesWorkedIn?.length ?? 0) > 0 ||
                      (user.geographiesCanHireIn?.length ?? 0) > 0) && (
                      <>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6">
                          <h4 className="text-md font-medium text-gray-900">
                            Work Coverage
                          </h4>
                        </div>
                        {(user.countriesWorkedIn?.length ?? 0) > 0 && (
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Countries Worked In
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.countriesWorkedIn?.join(", ")}
                            </dd>
                          </div>
                        )}
                        {(user.geographiesCanHireIn?.length ?? 0) > 0 && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                              Geographies Can Hire In
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user.geographiesCanHireIn?.join(", ")}
                            </dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Recruiter Type */}
                    {user.recruiterType && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Recruiter Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className="capitalize">
                            {user.recruiterType}
                          </span>
                        </dd>
                      </div>
                    )}
                  </>
                )}
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
                    Once you delete this user, there is no going back. This
                    action cannot be undone.
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
                      Are you sure you want to delete this user? This action
                      cannot be undone.
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
                        {isDeleting ? "Deleting..." : "Yes, Delete User"}
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
