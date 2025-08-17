"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import Sidebar from "./Sidebar";
import LogoutButton from "../LogoutButton";
import Link from "next/link";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Create context for sidebar state (optional - for more complex scenarios)
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
} | null>(null);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
          {/* Top Navigation */}
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center">
                {/* Mobile menu spacing */}
                <div className="w-10 md:w-0"></div>
                <Link
                  href={`/dashboard/${user?.role.toLowerCase() || ""}`}
                  className="text-gray-900 font-bold text-lg"
                >
                  SourcingScreen
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <Link
                      href={`/dashboard/profile`}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      <div className="flex items-center space-x-1">
                        <span className="w-5 h-5 inline-block">👤</span>
                        <span className="hidden sm:inline">
                          {user.name || user.email || "Account"}
                        </span>
                      </div>
                    </Link>
                    <LogoutButton />
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

// Export context hook for other components to use if needed
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a DashboardLayout");
  }
  return context;
};
