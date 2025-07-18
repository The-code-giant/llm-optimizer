'use client';

import React from 'react';
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              How we use cookies and similar technologies on Clever Search
            </p>
          </motion.div>
        </div>
      </section>

      {/* Last Updated */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Last updated: December 15, 2024</p>
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 prose prose-lg max-w-none">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What are cookies?</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                At Clever Search, we use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of cookies we use</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Essential Cookies</h3>
                  <p className="text-gray-600">These cookies are necessary for the website to function and cannot be switched off.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics Cookies</h3>
                  <p className="text-gray-600">These cookies allow us to count visits and traffic sources to measure and improve performance.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Marketing Cookies</h3>
                  <p className="text-gray-600">These cookies may be set by our advertising partners to build a profile of your interests.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Managing your preferences</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                You can control cookies through your browser settings or using our cookie preference center.
              </p>
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Consent Manager</h3>
                <p className="text-gray-600 mb-4">
                  Customize your cookie preferences to control what data we collect.
                </p>
                <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Manage Preferences
                </button>
              </div>
            </div>

            <div className="bg-black text-white rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Questions about cookies?</h2>
              <p className="text-gray-300 mb-6">
                Contact us if you have any questions about our cookie policy.
              </p>
              <Link href="/contact">
                <button className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
