//src/app/components/PayoutSettings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { toast } from "react-hot-toast";
import { 
  CreditCard, 
  Building2, 
  Mail, 
  Globe, 
  Shield, 
  Save, 
  Trash2,
  AlertCircle
} from "lucide-react";

interface BankTransferDetails {
  accountHolderName: string;
  bankName: string;
  branchIfscSortCode: string;
  accountNumberIban: string;
  swiftBicCode?: string;
  internalTransferIdReference?: string;
}

interface PayPalDetails {
  paypalEmail: string;
}

interface WiseDetails {
  registeredEmailOrAccountId: string;
}

interface VeemDetails {
  veemAccountEmailOrBusinessId: string;
}

interface PayoutSettingsData {
  preferredPaymentMethod: string;
  bankTransferDetails?: BankTransferDetails;
  paypalDetails?: PayPalDetails;
  wiseDetails?: WiseDetails;
  veemDetails?: VeemDetails;
}

const PayoutSettings: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [formData, setFormData] = useState<PayoutSettingsData>({
    preferredPaymentMethod: "",
  });

  // Fetch existing payout settings
  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const fetchPayoutSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/recruiter/payout-settings", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setFormData(result.data);
          setPaymentMethod(result.data.preferredPaymentMethod);
        }
      }
    } catch (error) {
      console.error("Error fetching payout settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof PayoutSettingsData] as object || {}),
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setFormData(prev => ({
      ...prev,
      preferredPaymentMethod: method,
      // Clear other payment method details when switching
      bankTransferDetails: method === "BANK_TRANSFER" ? prev.bankTransferDetails || {} as BankTransferDetails : undefined,
      paypalDetails: method === "PAYPAL" ? prev.paypalDetails || {} as PayPalDetails : undefined,
      wiseDetails: method === "WISE" ? prev.wiseDetails || {} as WiseDetails : undefined,
      veemDetails: method === "VEEM" ? prev.veemDetails || {} as VeemDetails : undefined,
    }));
  };

  const validateForm = (): boolean => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }

    switch (paymentMethod) {
      case "BANK_TRANSFER":
        const bank = formData.bankTransferDetails;
        if (!bank?.accountHolderName || !bank?.bankName || !bank?.branchIfscSortCode || !bank?.accountNumberIban) {
          toast.error("Please fill in all required bank transfer details");
          return false;
        }
        break;
      case "PAYPAL":
        if (!formData.paypalDetails?.paypalEmail) {
          toast.error("Please enter your PayPal email address");
          return false;
        }
        break;
      case "WISE":
        if (!formData.wiseDetails?.registeredEmailOrAccountId) {
          toast.error("Please enter your Wise email or account ID");
          return false;
        }
        break;
      case "VEEM":
        if (!formData.veemDetails?.veemAccountEmailOrBusinessId) {
          toast.error("Please enter your Veem account email or business ID");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/recruiter/payout-settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Payout settings saved successfully!");
        fetchPayoutSettings(); // Refresh data
      } else {
        toast.error(result.error || "Failed to save payout settings");
      }
    } catch (error) {
      console.error("Error saving payout settings:", error);
      toast.error("An error occurred while saving payout settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your payout settings?")) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/recruiter/payout-settings", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Payout settings deleted successfully!");
        setFormData({ preferredPaymentMethod: "" });
        setPaymentMethod("");
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to delete payout settings");
      }
    } catch (error) {
      console.error("Error deleting payout settings:", error);
      toast.error("An error occurred while deleting payout settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Payout Settings</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Please select your preferred payment method to receive funds:
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800">
              ✅ Your payment details will be securely stored and used only for processing payouts. 
              You can update your preferred method anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bank Transfer */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === "BANK_TRANSFER" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("BANK_TRANSFER")}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Bank Transfer</h4>
                <p className="text-sm text-gray-500">Domestic / International</p>
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === "PAYPAL" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("PAYPAL")}
          >
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">PayPal</h4>
                <p className="text-sm text-gray-500">Email-based payments</p>
              </div>
            </div>
          </div>

          {/* Wise */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === "WISE" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("WISE")}
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Wise (TransferWise)</h4>
                <p className="text-sm text-gray-500">International transfers</p>
              </div>
            </div>
          </div>

          {/* Veem */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === "VEEM" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("VEEM")}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Veem</h4>
                <p className="text-sm text-gray-500">Business payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Forms */}
      {paymentMethod === "BANK_TRANSFER" && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Transfer Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.accountHolderName || ""}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value, "bankTransferDetails")}
                placeholder="Enter account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.bankName || ""}
                onChange={(e) => handleInputChange("bankName", e.target.value, "bankTransferDetails")}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch / IFSC / Sort Code *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.branchIfscSortCode || ""}
                onChange={(e) => handleInputChange("branchIfscSortCode", e.target.value, "bankTransferDetails")}
                placeholder="Enter branch/IFSC/sort code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number / IBAN *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.accountNumberIban || ""}
                onChange={(e) => handleInputChange("accountNumberIban", e.target.value, "bankTransferDetails")}
                placeholder="Enter account number/IBAN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SWIFT / BIC Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.swiftBicCode || ""}
                onChange={(e) => handleInputChange("swiftBicCode", e.target.value, "bankTransferDetails")}
                placeholder="Enter SWIFT/BIC code (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Transfer ID / Reference Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bankTransferDetails?.internalTransferIdReference || ""}
                onChange={(e) => handleInputChange("internalTransferIdReference", e.target.value, "bankTransferDetails")}
                placeholder="Enter reference code (optional)"
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "PAYPAL" && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">PayPal Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PayPal Email Address *
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.paypalDetails?.paypalEmail || ""}
              onChange={(e) => handleInputChange("paypalEmail", e.target.value, "paypalDetails")}
              placeholder="Enter your PayPal email address"
            />
          </div>
        </div>
      )}

      {paymentMethod === "WISE" && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Wise (TransferWise) Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registered Email / Wise Account ID *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.wiseDetails?.registeredEmailOrAccountId || ""}
              onChange={(e) => handleInputChange("registeredEmailOrAccountId", e.target.value, "wiseDetails")}
              placeholder="Enter your Wise email or account ID"
            />
          </div>
        </div>
      )}

      {paymentMethod === "VEEM" && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Veem Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Veem Account Email / Business ID *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.veemDetails?.veemAccountEmailOrBusinessId || ""}
              onChange={(e) => handleInputChange("veemAccountEmailOrBusinessId", e.target.value, "veemDetails")}
              placeholder="Enter your Veem account email or business ID"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {paymentMethod && (
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
          
          {formData.preferredPaymentMethod && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Settings
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PayoutSettings;