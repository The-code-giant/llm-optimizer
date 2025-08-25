"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpenIcon,
  CodeBracketIcon,
  CogIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function Documentation() {
  const sections = [
    {
      title: "Getting Started",
      icon: RocketLaunchIcon,
      description:
        "Quick setup guide to get you optimizing for LLMs in minutes",
      articles: [
        {
          title: "Installation & Setup",
          href: "/docs/setup",
          time: "5 min read",
        },
        {
          title: "Your First Analysis",
          href: "/docs/first-analysis",
          time: "10 min read",
        },
        {
          title: "Understanding LLM Scores",
          href: "/docs/llm-scores",
          time: "8 min read",
        },
        {
          title: "Basic Configuration",
          href: "/docs/configuration",
          time: "12 min read",
        },
      ],
    },
    {
      title: "API Reference",
      icon: CodeBracketIcon,
      description: "Complete API documentation for developers and integrations",
      articles: [
        { title: "Authentication", href: "/docs/api/auth", time: "3 min read" },
        {
          title: "Analysis Endpoints",
          href: "/docs/api/analysis",
          time: "15 min read",
        },
        {
          title: "Content Injection API",
          href: "/docs/api/injection",
          time: "12 min read",
        },
        { title: "Webhooks", href: "/docs/api/webhooks", time: "8 min read" },
      ],
    },
    {
      title: "Optimization Guides",
      icon: CogIcon,
      description:
        "In-depth guides for maximizing your LLM optimization results",
      articles: [
        {
          title: "AI SEO Best Practices",
          href: "/docs/guides/ai-seo",
          time: "20 min read",
        },
        {
          title: "AEO Implementation",
          href: "/docs/guides/aeo",
          time: "18 min read",
        },
        {
          title: "GEO Strategies",
          href: "/docs/guides/geo",
          time: "15 min read",
        },
        {
          title: "LLMO Advanced Techniques",
          href: "/docs/guides/llmo",
          time: "25 min read",
        },
      ],
    },
    {
      title: "Tutorials",
      icon: BookOpenIcon,
      description: "Step-by-step tutorials for common optimization scenarios",
      articles: [
        {
          title: "E-commerce Optimization",
          href: "/docs/tutorials/ecommerce",
          time: "30 min read",
        },
        {
          title: "Blog Content Optimization",
          href: "/docs/tutorials/blog",
          time: "25 min read",
        },
        {
          title: "SaaS Landing Pages",
          href: "/docs/tutorials/saas",
          time: "20 min read",
        },
        {
          title: "Local Business SEO",
          href: "/docs/tutorials/local",
          time: "22 min read",
        },
      ],
    },
  ];

  const quickLinks = [
    { title: "Tracker Script Installation", href: "/docs/tracker", icon: "🔧" },
    { title: "Sitemap Import Guide", href: "/docs/sitemap", icon: "🗺️" },
    { title: "Content Injection Setup", href: "/docs/injection", icon: "💉" },
    { title: "API Keys & Authentication", href: "/docs/api-keys", icon: "🔑" },
    { title: "Troubleshooting", href: "/docs/troubleshooting", icon: "🔍" },
    { title: "FAQ", href: "/docs/faq", icon: "❓" },
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
              Documentation & Guides
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Everything you need to master LLM optimization and get the most
              out of our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/setup">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  API Reference
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Quick Links
            </h2>
            <p className="text-lg text-gray-600">
              Jump to the most commonly accessed documentation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={link.href} className="block">
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-blue-300">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">{link.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {link.title}
                        </h3>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
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
              Complete Documentation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive guides, tutorials, and references to help you
              succeed with LLM optimization.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.articles.map((article, articleIndex) => (
                    <Link
                      key={articleIndex}
                      href={article.href}
                      className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="font-medium text-gray-900">
                            {article.title}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">{article.time}</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Need additional help?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Our support team is here to help you succeed with LLM
              optimization.
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
              <Link href="/help">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3"
                >
                  Help Center
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
