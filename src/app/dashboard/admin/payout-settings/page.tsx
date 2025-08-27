"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../../store/index";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";
import { Eye, CreditCard, User, Mail, Phone, MapPin } from "lucide-react";

interface PayoutSettings {
  _id: string;
  userId: string;
  paymentMethod: "Bank Transfer" | "PayPal" | "Wise" | "Veem";
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    branchCode: string;
    accountNumber: string;
    swiftCode?: string;
    referenceCode?: string;
  };
  paypalDetails?: {
    email: string;
  };
  wiseDetails?: {
    email: string;
  };
  veemDetails?: {
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
  };
}

export default function AdminPayoutSettingsPage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<PayoutSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Fetch payout settings
  useEffect(() => {
    const fetchPayoutSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/payout-settings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch payout settings");
        }

        const data = await response.json();
        setPayoutSettings(data.payoutSettings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === UserRole.ADMIN) {
      fetchPayoutSettings();
    }
  }, [user]);

  // Filter payout settings based on search and payment method
  const filteredSettings = payoutSettings.filter((setting) => {
    const matchesSearch = 
      setting.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterMethod === "all" || setting.paymentMethod === filterMethod;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (settings: PayoutSettings) => {
    setSelectedSettings(settings);
  };

  const handleCloseModal = () => {
    setSelectedSettings(null);
  };

  const renderPaymentDetails = (settings: PayoutSettings) => {
    switch (settings.paymentMethod) {
      case "Bank Transfer":
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Account Holder:</span>
              <p className="text-sm text-gray-900">{settings.bankDetails?.accountHolderName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Bank Name:</span>
              <p className="text-sm text-gray-900">{settings.bankDetails?.bankName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Branch/IFSC/Sort Code:</span>
              <p className="text-sm text-gray-900">{settings.bankDetails?.branchCode}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Account Number/IBAN:</span>
              <p className="text-sm text-gray-900">{settings.bankDetails?.accountNumber}</p>
            </div>
            {settings.bankDetails?.swiftCode && (
              <div>
                <span className="text-sm font-medium text-gray-500">SWIFT/BIC Code:</span>
                <p className="text-sm text-gray-900">{settings.bankDetails.swiftCode}</p>
              </div>
            )}
            {settings.bankDetails?.referenceCode && (
              <div>
                <span className="text-sm font-medium text-gray-500">Reference Code:</span>
                <p className="text-sm text-gray-900">{settings.bankDetails.referenceCode}</p>
              </div>
            )}
          </div>
        );
      case "PayPal":
        return (
          <div>
            <span className="text-sm font-medium text-gray-500">PayPal Email:</span>
            <p className="text-sm text-gray-900">{settings.paypalDetails?.email}</p>
          </div>
        );
      case "Wise":
        return (
          <div>
            <span className="text-sm font-medium text-gray-500">Wise Email/Account ID:</span>
            <p className="text-sm text-gray-900">{settings.wiseDetails?.email}</p>
          </div>
        );
      case "Veem":
        return (
          <div>
            <span className="text-sm font-medium text-gray-500">Veem Email/Business ID:</span>
            <p className="text-sm text-gray-900">{settings.veemDetails?.email}</p>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500">No payment details available</p>;
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

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Recruiter Payout Settings
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage recruiter payment information for payouts
                </p>
              </div>
              <Link
                href="/dashboard/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search Recruiters
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, or payment method..."
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                      Filter by Payment Method
                    </label>
                    <select
                      id="filter"
                      value={filterMethod}
                      onChange={(e) => setFilterMethod(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="all">All Methods</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Wise">Wise</option>
                      <option value="Veem">Veem</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Settings Table */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recruiter Payment Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredSettings.length} recruiter{filteredSettings.length !== 1 ? 's' : ''} with payout settings configured
                </p>
              </div>
              
              {filteredSettings.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {payoutSettings.length === 0 ? "No payout settings found" : "No matching results"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {payoutSettings.length === 0 
                      ? "No recruiters have configured their payout settings yet."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recruiter
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSettings.map((setting) => (
                        <tr key={setting._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-indigo-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {setting.user?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {setting.userId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                {setting.user?.email || 'N/A'}
                              </div>
                              {setting.user?.phone && (
                                <div className="flex items-center mt-1">
                                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                  {setting.user.phone}
                                </div>
                              )}
                              {(setting.user?.city || setting.user?.country) && (
                                <div className="flex items-center mt-1">
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                  {[setting.user?.city, setting.user?.state, setting.user?.country]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {setting.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(setting.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(setting)}
                              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {selectedSettings && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Payout Settings Details
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Recruiter Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recruiter Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-sm text-gray-900">{selectedSettings.user?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">{selectedSettings.user?.email || 'N/A'}</p>
                      </div>
                      {selectedSettings.user?.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Phone:</span>
                          <p className="text-sm text-gray-900">{selectedSettings.user.phone}</p>
                        </div>
                      )}
                      {(selectedSettings.user?.city || selectedSettings.user?.country) && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <p className="text-sm text-gray-900">
                            {[selectedSettings.user?.city, selectedSettings.user?.state, selectedSettings.user?.country]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Details */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Payment Method: {selectedSettings.paymentMethod}
                    </h4>
                    {renderPaymentDetails(selectedSettings)}
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedSettings.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedSettings.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
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