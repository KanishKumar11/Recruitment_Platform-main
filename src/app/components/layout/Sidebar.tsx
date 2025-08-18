"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import { useState, useEffect } from "react";

interface SidebarLink {
  path: string;
  label: string;
  icon: string;
  target?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!user) return null;

  // Prevent hydration mismatch by not rendering mobile elements until mounted
  if (!isMounted) {
    return (
      <div className="fixed top-0 left-0 h-full bg-gray-800 text-white z-50 transform transition-all duration-300 ease-in-out -translate-x-full md:translate-x-0 md:static md:flex-shrink-0 md:w-48 w-64">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold truncate">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal
          </h2>
          <button
            className="hidden md:block text-gray-300 hover:text-white focus:outline-none"
            title="Collapse sidebar"
          >
            ←
          </button>
        </div>
        {/* Navigation placeholder */}
        <nav className="mt-5">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mx-4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3 mx-4 mb-4"></div>
          </div>
        </nav>
      </div>
    );
  }

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const toggleDesktopCollapse = () =>
    setIsDesktopCollapsed(!isDesktopCollapsed);

  const roleSpecificLinks: Record<string, SidebarLink[]> = {
    COMPANY: [
      { path: "/dashboard/company", label: "Dashboard", icon: "dashboard" },
      { path: "/dashboard/company/jobs", label: "My Jobs", icon: "briefcase" },
      { path: "/dashboard/help", label: "Help & Support", icon: "help" },
    ],
    RECRUITER: [
      { path: "/dashboard/recruiter", label: "Dashboard", icon: "dashboard" },
      { path: "/dashboard/recruiter/jobs", label: "Jobs", icon: "briefcase" },
      {
        path: "/dashboard/recruiter/submissions",
        label: "My Submissions",
        icon: "user-circle",
      },
      { path: "/faq", label: "FAQ", icon: "question-mark", target: "_blank" },
      { path: "/dashboard/help", label: "Help & Support", icon: "help" },
    ],
    ADMIN: [
      { path: "/dashboard/admin", label: "Dashboard", icon: "dashboard" },
      { path: "/dashboard/admin/users", label: "Users", icon: "users" },
      { path: "/dashboard/admin/jobs", label: "Jobs", icon: "briefcase" },
      {
        path: "/dashboard/admin/submissions",
        label: "Candidates",
        icon: "user-circle",
      },
      {
        path: "/dashboard/admin/email-notifications",
        label: "Email Statistics",
        icon: "mail",
      },
      { path: "/dashboard/admin/faqs", label: "FAQs", icon: "question-mark" },
      {
        path: "/dashboard/admin/support",
        label: "Support Tickets",
        icon: "support",
      },
      { path: "/dashboard/help", label: "Help & Support", icon: "help" },
    ],
    INTERNAL: [
      { path: "/dashboard/internal", label: "Dashboard", icon: "dashboard" },
      { path: "/dashboard/internal/jobs", label: "Jobs", icon: "briefcase" },
      {
        path: "/dashboard/internal/submissions",
        label: "Candidates",
        icon: "user-circle",
      },
      {
        path: "/dashboard/internal/faqs",
        label: "FAQs",
        icon: "question-mark",
      },
      {
        path: "/dashboard/internal/support",
        label: "Support Tickets",
        icon: "support",
      },
      { path: "/dashboard/help", label: "Help & Support", icon: "help" },
      // { path: '/dashboard/internal/reports', label: 'Reports', icon: 'chart-bar' }
    ],
  };

  const links = roleSpecificLinks[user.role] || [];

  const getIcon = (iconName: string) => {
    const icons = {
      dashboard: "📊",
      users: "👥",
      "user-circle": "👤",
      briefcase: "💼",
      cog: "⚙️",
      "chart-bar": "📈",
      "question-mark": "❓",
      support: "🎫",
      help: "🆘",
      mail: "📧",
    };
    return icons[iconName as keyof typeof icons] || "📄";
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded focus:outline-none"
        onClick={toggleMobileSidebar}
      >
        ☰
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white z-50 transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:flex-shrink-0
          ${isDesktopCollapsed ? "md:w-16" : "md:w-48"} w-64`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!isDesktopCollapsed && (
            <h2 className="text-sm font-bold truncate">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal
            </h2>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            className="hidden md:block text-gray-300 hover:text-white focus:outline-none"
            onClick={toggleDesktopCollapse}
            title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isDesktopCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-5">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  target={link.target}
                  rel={
                    link.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                >
                  <div
                    className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors relative group
                      ${pathname === link.path ? "bg-gray-700" : ""}`}
                    title={isDesktopCollapsed ? link.label : ""}
                  >
                    <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {getIcon(link.icon)}
                    </span>

                    {!isDesktopCollapsed && (
                      <span className="ml-3 truncate text-sm">
                        {link.label}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isDesktopCollapsed && (
                      <div
                        className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded 
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 
                                    whitespace-nowrap z-50"
                      >
                        {link.label}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse indicator for desktop */}
        {isDesktopCollapsed && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden md:block">
            <div className="w-8 h-1 bg-gray-600 rounded"></div>
          </div>
        )}
      </div>
    </>
  );
}
