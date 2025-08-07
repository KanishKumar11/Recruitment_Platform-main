"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "About Us", href: "#about", icon: InformationCircleIcon },
    {
      name: "How It Works",
      href: "#how-it-works",
      icon: QuestionMarkCircleIcon,
    },
    { name: "Why Choose Us", href: "/whyChooseUs", icon: UserIcon },
    { name: "FAQ", href: "/faq", icon: QuestionMarkCircleIcon },
    { name: "Contact", href: "/contactUs", icon: InformationCircleIcon },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SS</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                SourcingScreen
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 font-medium text-sm group"
                >
                  <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{ height: isMenuOpen ? "auto" : 0 }}
        className="md:hidden overflow-hidden bg-white border-t border-gray-100"
      >
        <div className="px-4 py-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
