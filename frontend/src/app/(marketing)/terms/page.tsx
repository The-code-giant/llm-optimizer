'use client';

import React from 'react';
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';

export default function Terms() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing and using Clever Search, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms apply to all visitors, users, and others who access or use the service."
      ]
    },
    {
      title: "Description of Service",
      content: [
        "Clever Search provides AI optimization tools and services to help businesses improve their visibility in large language model responses.",
        "Our platform analyzes content, provides optimization recommendations, and offers tools for improving LLM citation rates.",
        "We reserve the right to modify or discontinue the service at any time without notice."
      ]
    },
    {
      title: "User Accounts",
      content: [
        "You must create an account to access certain features of our service.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You are responsible for all activities that occur under your account.",
        "You must notify us immediately of any unauthorized use of your account."
      ]
    },
    {
      title: "Acceptable Use",
      content: [
        "You agree to use our service only for lawful purposes and in accordance with these terms.",
        "You may not use our service to violate any applicable laws or regulations.",
        "You may not attempt to gain unauthorized access to our systems or other users' accounts.",
        "You may not use our service to distribute malware, spam, or other harmful content."
      ]
    },
    {
      title: "Content and Intellectual Property",
      content: [
        "You retain ownership of any content you submit to our platform.",
        "By submitting content, you grant us a license to use, modify, and display that content as necessary to provide our services.",
        "Our service and its original content, features, and functionality are owned by Clever Search and are protected by copyright and other intellectual property laws.",
        "You may not reproduce, distribute, or create derivative works from our content without permission."
      ]
    },
    {
      title: "Payment and Billing",
      content: [
        "Paid services are billed in advance on a monthly or annual basis.",
        "All fees are non-refundable except as required by law or as specifically stated in our refund policy.",
        "We reserve the right to change our pricing at any time with 30 days notice.",
        "Failure to pay fees may result in suspension or termination of your account."
      ]
    },
    {
      title: "Privacy and Data Protection",
      content: [
        "Your privacy is important to us. Please review our Privacy Policy for information about how we collect and use your data.",
        "We implement security measures to protect your personal information.",
        "You consent to the collection and use of your information as outlined in our Privacy Policy.",
        "We may use aggregated, anonymized data for analytical and improvement purposes."
      ]
    },
    {
      title: "Disclaimers and Limitations",
      content: [
        "Our service is provided 'as is' without warranties of any kind, either express or implied.",
        "We do not guarantee that our service will be uninterrupted, secure, or error-free.",
        "We are not responsible for any damages resulting from your use of our service.",
        "Our liability is limited to the amount you paid for our services in the 12 months preceding any claim."
      ]
    },
    {
      title: "Termination",
      content: [
        "You may terminate your account at any time by contacting us or using the account deletion feature.",
        "We may terminate or suspend your account immediately if you violate these terms.",
        "Upon termination, your right to use the service will cease immediately.",
        "We may retain certain information as required by law or for legitimate business purposes."
      ]
    },
    {
      title: "Changes to Terms",
      content: [
        "We reserve the right to modify these terms at any time.",
        "We will notify users of any material changes by posting the new terms on our website.",
        "Your continued use of the service after changes constitutes acceptance of the new terms.",
        "If you do not agree to the modified terms, you should discontinue use of the service."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These terms are governed by the laws of the State of California, United States.",
        "Any disputes arising from these terms will be resolved in the courts of San Francisco County, California.",
        "If any provision of these terms is found to be unenforceable, the remaining provisions will remain in effect.",
        "These terms constitute the entire agreement between you and Clever Search regarding the service."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              These terms govern your use of Clever Search and outline the rights 
              and responsibilities of all parties.
            </p>
            <p className="text-gray-400">
              Last updated: December 15, 2024
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Introduction</h2>
            <div className="prose prose-lg text-gray-600 leading-relaxed">
              <p className="mb-6">
                                      Welcome to Clever Search. These Terms of Service (&quot;Terms&quot;) govern your use of our
        website, platform, and services (collectively, the &quot;Service&quot;) operated by Clever Search 
                (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).
              </p>
              <p className="mb-6">
                Please read these Terms carefully before using our Service. By accessing or using our Service, 
                you agree to be bound by these Terms. If you disagree with any part of these terms, 
                then you may not access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-16">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h3>
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-600 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Questions about these terms?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              If you have any questions about these Terms of Service, 
              please don&apos;t hesitate to contact us.
            </p>
            <div className="bg-gray-800 rounded-xl p-8 text-left max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4 text-gray-300">
                <p><strong className="text-white">Email:</strong> legal@cleversearch.ai</p>
                <p><strong className="text-white">Address:</strong> 123 AI Street, Suite 100, San Francisco, CA 94102</p>
                <p><strong className="text-white">Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 