"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/store/index";
import { setCredentials } from "@/app/store/slices/authSlice";

interface UpdateProfileFormData {
  name: string;
  email: string;
  phone: string;
  // Company-specific fields
  companyName?: string;
  companySize?: string;
  designation?: string;

  // Recruiter-specific fields
  recruitmentFirmName?: string;
  profilePicture?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  otherContactInfo?: string;
  country?: string;
  state?: string;
  city?: string;
  totalWorkExperience?: number;
  recruitmentExperience?: number;
  rolesClosedLastYear?: number;
  countriesWorkedIn?: string[];
  bio?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  otherSocialUrl?: string;
  geographiesCanHireIn?: string[];
  recruiterType?: "individual" | "company";
  // Company details for recruiters
  recruiterCompanyName?: string;
  recruiterDesignation?: string;
  recruiterCompanySize?: string;
  companyEstablishmentYears?: number;
  companyProfile?: string;
  resumeFile?: File | null;
  resumeFileUrl?: string;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const COMPANY_SIZES = [
  "Self Employed",
  "2-10 Employees",
  "11-50 Employees",
  "51-200 Employees",
  "201-500 Employees",
  "501+ Employees",
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export default function UserProfile() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Profile data states
  const [profileData, setProfileData] = useState<UpdateProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    // Initialize company fields
    ...(user?.role === "COMPANY" && {
      companyName: "",
      companySize: "",
      designation: "",
    }),
    // Initialize recruiter fields
    ...(user?.role === "RECRUITER" && {
      recruitmentFirmName: "",
      profilePicture: "",
      mobileNumber: "",
      whatsappNumber: "",
      otherContactInfo: "",
      country: "",
      state: "",
      city: "",
      totalWorkExperience: 0,
      recruitmentExperience: 0,
      rolesClosedLastYear: 0,
      countriesWorkedIn: [],
      bio: "",
      linkedinUrl: "",
      facebookUrl: "",
      otherSocialUrl: "",
      geographiesCanHireIn: [],
      recruiterType: "individual",
      recruiterCompanyName: "",
      recruiterDesignation: "",
      recruiterCompanySize: "",
      companyEstablishmentYears: 0,
      companyProfile: "",
      resumeFile: null,
    }),
  });

  // Additional state for file handling
  const [profilePicturePreview, setProfilePicturePreview] =
    useState<string>("");

  // Password change states
  const [passwordData, setPasswordData] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setProfileData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone || "",
            // Include company fields if user is COMPANY role
            ...(userData.role === "COMPANY" && {
              companyName: userData.companyName || "",
              companySize: userData.companySize || "",
              designation: userData.designation || "",
            }),
            // Include recruiter fields if user is RECRUITER role
            ...(userData.role === "RECRUITER" && {
              recruitmentFirmName: userData.recruitmentFirmName || "",
              profilePicture: userData.profilePicture || "",
              mobileNumber: userData.mobileNumber || "",
              whatsappNumber: userData.whatsappNumber || "",
              otherContactInfo: userData.otherContactInfo || "",
              country: userData.country || "",
              state: userData.state || "",
              city: userData.city || "",
              totalWorkExperience: userData.totalWorkExperience || 0,
              recruitmentExperience: userData.recruitmentExperience || 0,
              rolesClosedLastYear: userData.rolesClosedLastYear || 0,
              countriesWorkedIn: userData.countriesWorkedIn || [],
              bio: userData.bio || "",
              linkedinUrl: userData.linkedinUrl || "",
              facebookUrl: userData.facebookUrl || "",
              otherSocialUrl: userData.otherSocialUrl || "",
              geographiesCanHireIn: userData.geographiesCanHireIn || [],
              recruiterType: userData.recruiterType || "individual",
              recruiterCompanyName: userData.recruiterCompanyName || "",
              recruiterDesignation: userData.recruiterDesignation || "",
              recruiterCompanySize: userData.recruiterCompanySize || "",
              companyEstablishmentYears:
                userData.companyEstablishmentYears || 0,
              companyProfile: userData.companyProfile || "",
              resumeFile: null,
            }),
          });

          // Set profile picture preview if exists
          if (userData.role === "RECRUITER" && userData.profilePicture) {
            setProfilePicturePreview(userData.profilePicture);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    if (user && token) {
      fetchUserProfile();
    }
  }, [user, token]);

  // Handle profile picture upload
  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        // 500KB limit
        setError("Profile picture must be less than 500KB");
        return;
      }

      try {
        // Upload file to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", "profile");

        const response = await fetch("/api/user/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setProfilePicturePreview(result.fileUrl);
          setProfileData({ ...profileData, profilePicture: result.fileUrl });
        } else {
          const error = await response.json();
          setError(error.error || "Failed to upload profile picture");
        }
      } catch (error) {
        console.error("Profile picture upload error:", error);
        setError("Failed to upload profile picture");
      }
    }
  };

  // Handle resume file upload
  const handleResumeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        // 500KB limit
        setError("Resume file must be less than 500KB");
        return;
      }

      try {
        // Upload file to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", "resume");

        const response = await fetch("/api/user/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setProfileData({ ...profileData, resumeFileUrl: result.fileUrl });
          setProfileUpdateSuccess(true);
        } else {
          const error = await response.json();
          setError(error.error || "Failed to upload resume");
        }
      } catch (error) {
        console.error("Resume upload error:", error);
        setError("Failed to upload resume");
      }
    }
  };

  // Handle multi-select for countries
  const handleCountrySelection = (
    country: string,
    field: "countriesWorkedIn" | "geographiesCanHireIn"
  ) => {
    const currentList = profileData[field] || [];
    const updatedList = currentList.includes(country)
      ? currentList.filter((c) => c !== country)
      : [...currentList, country];
    setProfileData({ ...profileData, [field]: updatedList });
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProfileUpdateSuccess(false);
    setIsUpdating(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUserData = await response.json();

        // Update Redux state with new user data
        if (user && token) {
          dispatch(
            setCredentials({
              user: {
                ...user,
                name: updatedUserData.name,
                email: updatedUserData.email,
                ...(updatedUserData.role === "COMPANY" && {
                  companyName: updatedUserData.companyName,
                  companySize: updatedUserData.companySize,
                  designation: updatedUserData.designation,
                }),
              },
              token,
            })
          );
        }

        setProfileUpdateSuccess(true);
        setTimeout(() => setProfileUpdateSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordUpdateSuccess(false);

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        // Reset password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setPasswordUpdateSuccess(true);
        setTimeout(() => setPasswordUpdateSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg overflow-hidden">
      {/* Profile Header Section */}
      <div className="bg-indigo-600 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="bg-white rounded-full p-1 shadow-md">
            <div className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="bg-indigo-800 bg-opacity-50 text-xs uppercase tracking-wider px-2 py-1 rounded-full">
                {user.role}
              </span>
              <span className="bg-green-500 bg-opacity-80 text-xs uppercase tracking-wider px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-indigo-100 mt-2">{profileData.email}</p>
            {/* Show company info in header if available */}
            {user.role === "COMPANY" && profileData.companyName && (
              <div className="mt-3 text-indigo-100">
                <p className="text-sm">
                  {profileData.designation} at {profileData.companyName}
                </p>
                <p className="text-xs text-indigo-200">
                  {profileData.companySize}
                </p>
              </div>
            )}
            {/* Show recruitment firm info in header if available */}
            {user.role === "RECRUITER" && profileData.recruitmentFirmName && (
              <div className="mt-3 text-indigo-100">
                <p className="text-sm">
                  Recruiter at {profileData.recruitmentFirmName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          className={`flex-1 sm:flex-none px-6 py-4 font-medium text-sm sm:text-base transition-all ${
            activeTab === "profile"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            Profile Information
          </div>
        </button>
        <button
          className={`flex-1 sm:flex-none px-6 py-4 font-medium text-sm sm:text-base transition-all ${
            activeTab === "security"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("security")}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Security
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Profile Information Tab */}
        {activeTab === "profile" && (
          <div>
            {profileUpdateSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Profile updated successfully!</span>
              </div>
            )}

            <div className="bg-gray-50 p-5 rounded-lg mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Personal Details
              </h3>
              <p className="text-gray-600 mb-2">
                Update your personal information and contact details.
              </p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Personal Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={user.role}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Company Information Section - Only for COMPANY role */}
              {user.role === "COMPANY" && (
                <>
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-indigo-50 p-5 rounded-lg mb-6">
                      <h3 className="text-lg font-medium text-indigo-800 mb-2">
                        Company Information
                      </h3>
                      <p className="text-indigo-600 text-sm">
                        Update your company details and professional
                        information.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={profileData.companyName || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                companyName: e.target.value,
                              })
                            }
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Company Size
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <select
                            value={profileData.companySize || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                companySize: e.target.value,
                              })
                            }
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 appearance-none bg-white"
                            required
                          >
                            <option value="">Select company size</option>
                            {COMPANY_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Job Title / Designation
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={profileData.designation || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                designation: e.target.value,
                              })
                            }
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            placeholder="e.g., HR Manager, CEO, Talent Acquisition Specialist"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Recruiter Information Section - Only for RECRUITER role */}
              {user.role === "RECRUITER" && (
                <>
                  <div className="pt-6 border-t border-gray-200">
                    <div className="bg-green-50 p-5 rounded-lg mb-6">
                      <h3 className="text-lg font-medium text-green-800 mb-2">
                        Recruiter Profile Information
                      </h3>
                      <p className="text-green-600 text-sm">
                        Complete your professional recruiter profile.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Profile Picture */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Profile Picture
                        </label>
                        <div className="flex items-center space-x-6">
                          <div className="shrink-0">
                            {profilePicturePreview ? (
                              <img
                                className="h-20 w-20 object-cover rounded-full"
                                src={profilePicturePreview}
                                alt="Profile preview"
                              />
                            ) : (
                              <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg
                                  className="h-8 w-8 text-gray-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Max file size: 500KB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.mobileNumber || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                mobileNumber: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="+1 234 567 8900"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.whatsappNumber || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                whatsappNumber: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Other Contact Information
                        </label>
                        <textarea
                          value={profileData.otherContactInfo || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              otherContactInfo: e.target.value,
                            })
                          }
                          rows={2}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Skype, Telegram, or other contact methods"
                        />
                      </div>

                      {/* Location */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Country
                          </label>
                          <select
                            value={profileData.country || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                country: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Country</option>
                            {COUNTRIES.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            State
                          </label>
                          <input
                            type="text"
                            value={profileData.state || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                state: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="State/Province"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            value={profileData.city || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                city: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="City"
                          />
                        </div>
                      </div>

                      {/* Experience Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Total Work Experience (Years)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={profileData.totalWorkExperience || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                totalWorkExperience:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Years of Recruitment Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={profileData.recruitmentExperience || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                recruitmentExperience:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Roles Closed (Last 12 Months)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={profileData.rolesClosedLastYear || ""}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                rolesClosedLastYear:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Countries Worked In */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Which Countries have you closed roles before?
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                          {COUNTRIES.map((country) => (
                            <label
                              key={country}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  profileData.countriesWorkedIn?.includes(
                                    country
                                  ) || false
                                }
                                onChange={() =>
                                  handleCountrySelection(
                                    country,
                                    "countriesWorkedIn"
                                  )
                                }
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{country}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio || ""}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              bio: e.target.value,
                            })
                          }
                          rows={4}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Tell us about your recruitment experience, specializations, and what makes you unique..."
                        />
                      </div>

                      {/* Social Media Links */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-800">
                          Social Media Links
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              LinkedIn
                            </label>
                            <input
                              type="url"
                              value={profileData.linkedinUrl || ""}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  linkedinUrl: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://linkedin.com/in/yourprofile"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Facebook
                            </label>
                            <input
                              type="url"
                              value={profileData.facebookUrl || ""}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  facebookUrl: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://facebook.com/yourprofile"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Other
                            </label>
                            <input
                              type="url"
                              value={profileData.otherSocialUrl || ""}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  otherSocialUrl: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="https://twitter.com/yourprofile"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Geographies Can Hire In */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Geographies you can hire in
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                          {COUNTRIES.map((country) => (
                            <label
                              key={country}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  profileData.geographiesCanHireIn?.includes(
                                    country
                                  ) || false
                                }
                                onChange={() =>
                                  handleCountrySelection(
                                    country,
                                    "geographiesCanHireIn"
                                  )
                                }
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{country}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Individual or Company Toggle */}
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Are you an individual recruiter or part of a company?
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recruiterType"
                              value="individual"
                              checked={
                                profileData.recruiterType === "individual"
                              }
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  recruiterType: e.target.value as
                                    | "individual"
                                    | "company",
                                })
                              }
                              className="mr-2 text-indigo-600 focus:ring-indigo-500"
                            />
                            Individual
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recruiterType"
                              value="company"
                              checked={profileData.recruiterType === "company"}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  recruiterType: e.target.value as
                                    | "individual"
                                    | "company",
                                })
                              }
                              className="mr-2 text-indigo-600 focus:ring-indigo-500"
                            />
                            Company
                          </label>
                        </div>
                      </div>

                      {/* Company Details - Show only if recruiterType is 'company' */}
                      {profileData.recruiterType === "company" && (
                        <div className="space-y-6 p-6 bg-blue-50 rounded-lg">
                          <h4 className="text-lg font-medium text-blue-800">
                            Company Details/Agency Details
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Company Name
                              </label>
                              <input
                                type="text"
                                value={profileData.recruiterCompanyName || ""}
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    recruiterCompanyName: e.target.value,
                                  })
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your Company Name"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Your Designation
                              </label>
                              <input
                                type="text"
                                value={profileData.recruiterDesignation || ""}
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    recruiterDesignation: e.target.value,
                                  })
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g., Senior Recruiter, HR Manager"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Company Size
                              </label>
                              <select
                                value={profileData.recruiterCompanySize || ""}
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    recruiterCompanySize: e.target.value,
                                  })
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Select Company Size</option>
                                {COMPANY_SIZES.map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Company Establishment (in years)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  profileData.companyEstablishmentYears || ""
                                }
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    companyEstablishmentYears:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Years in business"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Company Profile
                            </label>
                            <textarea
                              value={profileData.companyProfile || ""}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  companyProfile: e.target.value,
                                })
                              }
                              rows={4}
                              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Describe your company, services, specializations, and achievements..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Resume/Company Profile Upload */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Resume/Company Profile Upload
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <p className="text-xs text-gray-500">
                          Max file size: 500KB. Accepted formats: PDF, DOC, DOCX
                        </p>
                        {profileData.resumeFile && (
                          <p className="text-sm text-green-600">
                            Selected: {profileData.resumeFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div>
            {passwordUpdateSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Password changed successfully!</span>
              </div>
            )}

            <div className="bg-gray-50 p-5 rounded-lg mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Password Settings
              </h3>
              <p className="text-gray-600 mb-2">
                Ensure your account stays secure by using a strong, unique
                password.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long and include
                    uppercase, lowercase, and numbers.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
