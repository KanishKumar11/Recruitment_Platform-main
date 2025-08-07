"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import PublicHeader from "@/app/components/layout/PublicHeader";
import PublicFooter from "@/app/components/layout/PublicFooter";
import { useGetPublicFAQsQuery, FAQ } from "@/app/store/services/faqApi";

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // RTK Query hook
  const { data: faqsData, isLoading, error } = useGetPublicFAQsQuery({});

  const faqs = faqsData?.faqs || [];

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const toggleAll = () => {
    if (openItems.size === filteredFAQs.length) {
      setOpenItems(new Set());
    } else {
      setOpenItems(new Set(filteredFAQs.map((faq) => faq._id)));
    }
  };

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(faqs.map((faq) => faq.category))),
  ];

  // Filter FAQs based on category and search term
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group FAQs by category for display
  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      General: QuestionMarkCircleIcon,
      "Job Posting": LightBulbIcon,
      "Recruitment Process": ChatBubbleLeftRightIcon,
      Payments: SparklesIcon,
    };
    return icons[category] || QuestionMarkCircleIcon;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      General: "from-blue-500 to-indigo-600",
      "Job Posting": "from-green-500 to-emerald-600",
      "Recruitment Process": "from-purple-500 to-violet-600",
      Payments: "from-orange-500 to-red-600",
    };
    return colors[category] || "from-gray-500 to-gray-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <PublicHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading FAQs...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <QuestionMarkCircleIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Frequently Asked
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about SourcingScreen. Our
              comprehensive FAQ covers everything from getting started to
              advanced features.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white min-w-48"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle All Button */}
              <button
                onClick={toggleAll}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {openItems.size === filteredFAQs.length
                  ? "Collapse All"
                  : "Expand All"}
              </button>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredFAQs.length > 0 && (
                <span>
                  Showing {filteredFAQs.length} of {faqs.length} questions
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedCategory !== "All" && ` in ${selectedCategory}`}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">Error loading FAQs</p>
                <p className="text-red-600 text-sm">
                  {typeof error === "string" ? error : "Failed to load FAQs"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {filteredFAQs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No FAQs Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search or filter criteria."
                : "No FAQs are available at the moment."}
            </p>
            {(searchTerm || selectedCategory !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(
              ([category, categoryFAQs], categoryIndex) => {
                const IconComponent = getCategoryIcon(category);
                const colorClass = getCategoryColor(category);

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    {selectedCategory === "All" && (
                      <div
                        className={`bg-gradient-to-r ${colorClass} px-6 py-4`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <h2 className="text-xl font-bold text-white">
                            {category}
                          </h2>
                          <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-full">
                            {categoryFAQs.length}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-gray-100">
                      {categoryFAQs
                        .sort((a, b) => a.order - b.order)
                        .map((faq, index) => (
                          <motion.div
                            key={faq._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              delay: categoryIndex * 0.1 + index * 0.05,
                            }}
                            className="group"
                          >
                            <button
                              onClick={() => toggleItem(faq._id)}
                              className="w-full text-left px-6 py-6 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-indigo-600 transition-colors">
                                  {faq.question}
                                </h3>
                                <motion.div
                                  animate={{
                                    rotate: openItems.has(faq._id) ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-shrink-0"
                                >
                                  <ChevronDownIcon className="h-5 w-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                </motion.div>
                              </div>
                            </button>

                            <AnimatePresence>
                              {openItems.has(faq._id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 pb-6">
                                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-l-4 border-indigo-500">
                                      <div
                                        className="text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                          __html: faq.answer,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="relative px-6 py-12 sm:px-12 text-center">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Still have questions?
              </h3>
              <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to
                help you succeed. Get personalized assistance from our experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contactUs"
                  className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Contact Support
                </a>
                <a
                  href="/dashboard/help"
                  className="inline-flex items-center px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  <LightBulbIcon className="h-5 w-5 mr-2" />
                  Help Center
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <PublicFooter />
    </div>
  );
}
