"use client";

import { useState, useEffect } from "react";
import PublicFooter from "@/app/components/layout/PublicFooter";
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  Lightbulb,
  Rocket,
  Globe,
  CheckCircle,
  Sparkles,
  Building,
  Code,
  Heart,
  Zap,
  TrendingUp,
  Shield,
  Award,
} from "lucide-react";

export default function OurStoryPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeTimeline, setActiveTimeline] = useState(0);

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Timeline data
  const timeline = [
    {
      year: "2023",
      title: "The Beginning",
      description: "Founded by a team of HR experts and software engineers who recognized the need for a revolutionary approach to talent sourcing.",
      icon: <Lightbulb className="h-6 w-6" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      year: "2024",
      title: "AI Integration",
      description: "Launched our AI-powered matching system, connecting recruiters to the most relevant jobs based on their expertise and track record.",
      icon: <Code className="h-6 w-6" />,
      color: "from-purple-500 to-indigo-600",
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Established a worldwide network of pre-vetted recruitment partners across multiple industries and geographies.",
      icon: <Globe className="h-6 w-6" />,
      color: "from-green-500 to-teal-600",
    },
    {
      year: "Future",
      title: "Innovation Continues",
      description: "Constantly evolving our platform with new features, enhanced AI capabilities, and expanded global reach.",
      icon: <Rocket className="h-6 w-6" />,
      color: "from-pink-500 to-rose-600",
    },
  ];

  // Core values
  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "People First",
      description: "We believe great companies are built by great people. Every feature we develop puts human connection at the center.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Transparency",
      description: "No hidden fees, no surprises. We believe in honest, transparent relationships with both employers and recruiters.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Innovation",
      description: "We constantly push the boundaries of what's possible in recruitment technology while keeping the human element intact.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Results-Driven",
      description: "Success is measured by the quality of matches we make and the long-term relationships we help build.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Collaboration",
      description: "We foster a collaborative ecosystem where recruiters, employers, and candidates all benefit from our platform.",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Excellence",
      description: "We maintain the highest standards in everything we do, from our technology to our customer service.",
    },
  ];

  // Key achievements
  const achievements = [
    {
      number: "500+",
      label: "Global Recruiters",
      description: "Pre-vetted recruitment partners worldwide",
    },
    {
      number: "95%",
      label: "Match Accuracy",
      description: "AI-powered precision in recruiter-job matching",
    },
    {
      number: "60%",
      label: "Faster Hiring",
      description: "Reduced time-to-hire for our clients",
    },
    {
      number: "100%",
      label: "Transparency",
      description: "Complete visibility into the hiring process",
    },
  ];

  const features = [
    "One Online Platform. Global Agency Network.",
    "Global Talent Network – Access diverse pre-vetted recruitment partners",
    "AI-Powered Matching – Smart algorithms for precise connections",
    "No Subscription Needed – Join for free, start immediately",
    "Transparent, Scalable, and Results-Driven Hiring",
    "Streamlined Workflow – Real-time communication and tracking"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950">
      <div className="container mx-auto px-4 py-16 lg:px-8">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </a>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                Our Story
              </span>
            </h1>

            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
              The journey of revolutionizing talent sourcing and creating the future of recruitment through innovation, transparency, and human connection.
            </p>
          </div>
        </div>

        {/* Main Story Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="mb-16">
            <div className="bg-gray-800/70 rounded-xl border border-gray-700 p-8 md:p-12 shadow-xl hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-6 shadow-lg">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    SourcingScreen – The Future of Talent Sourcing
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                </div>
              </div>

              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p className="text-lg">
                  Founded in <span className="font-semibold text-indigo-300">2023</span>, SourcingScreen is a next-generation Recruitment & Hiring Marketplace powered by AI, designed to revolutionize the way companies and recruitment agencies connect. We eliminate the inefficiencies of traditional hiring by offering a transparent, data-driven platform where employers find the best talent and recruiters maximize their success.
                </p>

                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-800/30">
                  <p className="text-indigo-200 font-medium">
                    Our team of HR experts and software engineers collaborated to build a platform that bridges the gap between companies and recruitment agencies, creating a seamless ecosystem where both parties can thrive.
                  </p>
                </div>

                <p>
                  At SourcingScreen, we bring together the power of AI, smart automation, and a global vendor network to create a seamless talent acquisition ecosystem. Whether you're hiring for technology, healthcare, manufacturing, finance, or any other sector, we have pre-vetted vendor partners across industries ready to deliver results.
                </p>

                <p>
                  Companies get access to a broader, qualified talent pool while agencies gain access to high-value job opportunities from around the globe. We've created a marketplace where every placement counts, and every connection matters.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features Highlight */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  What We Offer
                </h3>
              </div>
              <div className="h-1 w-20 bg-green-500 mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500/30 transition-all duration-300 group"
                >
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-indigo-400 mr-2" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Our Journey
              </h3>
            </div>
            <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6"></div>
            <p className="text-gray-300">
              From inception to global platform - the milestones that shaped SourcingScreen
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-600 hidden md:block"></div>
            
            {timeline.map((item, index) => (
              <div
                key={index}
                onMouseEnter={() => setActiveTimeline(index)}
                className="relative flex items-center mb-12 group"
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center mr-8 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 z-10`}>
                  {item.icon}
                </div>
                
                <div className="flex-grow bg-gray-800/70 rounded-xl border border-gray-700 p-6 group-hover:border-indigo-500/50 transition-all duration-300 shadow-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl font-bold text-indigo-400 mr-4">
                      {item.year}
                    </span>
                    <h4 className="text-xl font-semibold text-white">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-gray-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-yellow-400 mr-2" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Our Achievements
              </h3>
            </div>
            <div className="h-1 w-20 bg-yellow-500 mx-auto mb-6"></div>
            <p className="text-gray-300">
              Numbers that reflect our commitment to excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-yellow-500/30 transition-all duration-300 group hover:scale-105 shadow-lg"
              >
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                  {achievement.number}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {achievement.label}
                </h4>
                <p className="text-sm text-gray-300">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Our Values
              </h3>
            </div>
            <div className="h-1 w-20 bg-purple-500 mx-auto mb-6"></div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do at SourcingScreen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500/30 transition-all duration-300 shadow-lg group hover:scale-105"
              >
                <div className="h-14 w-14 rounded-full bg-purple-900/50 flex items-center justify-center mb-4 text-purple-400 group-hover:bg-purple-800/50 group-hover:scale-110 transition-all duration-300">
                  {value.icon}
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">
                  {value.title}
                </h4>
                <p className="text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              A Marketplace Built for Recruiters & Employers
            </h3>
            <p className="text-indigo-100 mb-6 text-lg leading-relaxed">
              Join the future of recruitment—where every placement counts. Showcase your best talent, and grow your recruitment business with every successful hire.
            </p>
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              🌐 Explore SourcingScreen.com Today!
            </button>
          </div>
        </div>

        {/* Footer */}
        <PublicFooter />
      </div>
    </div>
  );
}