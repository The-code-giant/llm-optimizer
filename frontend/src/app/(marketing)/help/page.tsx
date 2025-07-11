'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function Help() {
  const helpCategories = [
    {
      title: "Getting Started",
      icon: PlayIcon,
      description: "Learn the basics of LLM optimization",
      articles: [
        "Setting up your first site analysis",
        "Understanding your LLM readiness score",
        "Installing the tracker script",
        "Importing your sitemap"
      ]
    },
    {
      title: "Platform Features",
      icon: BookOpenIcon,
      description: "Detailed guides for all platform features",
      articles: [
        "Content analysis and recommendations",
        "FAQ generation and injection",
        "Performance tracking and metrics",
        "Team collaboration tools"
      ]
    },
    {
      title: "Optimization Strategies",
      icon: QuestionMarkCircleIcon,
      description: "Best practices for LLM optimization",
      articles: [
        "Structuring content for AI systems",
        "Writing LLM-friendly headlines",
        "Optimizing for different AI platforms",
        "Measuring optimization success"
      ]
    },
    {
      title: "Technical Support",
      icon: ChatBubbleLeftRightIcon,
      description: "Troubleshooting and technical issues",
      articles: [
        "Common integration problems",
        "API authentication issues",
        "Performance optimization tips",
        "Browser compatibility guide"
      ]
    }
  ];

  const popularArticles = [
    {
      title: "How to improve your LLM readiness score",
      category: "Optimization",
      readTime: "5 min read",
      helpful: 245
    },
    {
      title: "Setting up content injection for FAQs",
      category: "Features",
      readTime: "8 min read",
      helpful: 189
    },
    {
      title: "Understanding LLM citation patterns",
      category: "Analytics",
      readTime: "12 min read",
      helpful: 167
    },
    {
      title: "Troubleshooting tracker script installation",
      category: "Technical",
      readTime: "6 min read",
      helpful: 134
    },
    {
      title: "Best practices for AI-friendly content structure",
      category: "Strategy",
      readTime: "10 min read",
      helpful: 128
    }
  ];

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: "💬",
      action: "Chat now",
      href: "/contact"
    },
    {
      title: "Book a Demo",
      description: "Schedule a personalized walkthrough",
      icon: "📅",
      action: "Schedule",
      href: "/demo"
    },
    {
      title: "API Documentation",
      description: "Technical documentation for developers",
      icon: "🔧",
      action: "View docs",
      href: "/docs"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: "🎥",
      action: "Watch",
      href: "/tutorials"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
              How can we help you?
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Find answers, get support, and learn how to make the most of Clever Search.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and tutorials..."
                  className="w-full pl-12 pr-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Actions</h2>
            <p className="text-lg text-gray-600">
              Get immediate help or access resources
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={action.href} className="block">
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 text-center border border-gray-200 hover:border-blue-300">
                    <div className="text-4xl mb-4">{action.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                    <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-lg">
                      {action.action}
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Browse by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find detailed guides and tutorials organized by topic.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <category.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <Link
                      key={articleIndex}
                      href={`/help/article/${article.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-900">{article}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Popular Articles
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The most helpful articles based on user feedback and views.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {popularArticles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link
                  href={`/help/article/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {article.category}
                        </span>
                        <span className="text-gray-500 text-sm">{article.readTime}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {article.helpful} people found this helpful
                      </p>
                    </div>
                    <div className="ml-6">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Still need help?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Our support team is available 24/7 to help you succeed with LLM optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Contact Support
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3"
              >
                Live Chat
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 