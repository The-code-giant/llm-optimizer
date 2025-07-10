'use client';

import React from 'react';
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';

export default function Privacy() {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.",
        "Account Information: Name, email address, company information, and other details you provide when creating an account.",
        "Usage Data: Information about how you use our platform, including pages visited, features used, and time spent on the platform.",
        "Technical Data: IP address, browser type, device information, and other technical identifiers."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "We use the information we collect to provide, maintain, and improve our services.",
        "Provide and deliver the LLM optimization services you request",
        "Process transactions and send related information",
        "Send technical notices, updates, security alerts, and support messages",
        "Respond to your comments, questions, and customer service requests",
        "Monitor and analyze trends, usage, and activities in connection with our services"
      ]
    },
    {
      title: "Information Sharing and Disclosure",
      content: [
        "We do not sell, rent, or share your personal information with third parties except as described in this policy.",
        "Service Providers: We may share information with third-party service providers who perform services on our behalf.",
        "Legal Requirements: We may disclose information if required by law or in response to valid legal requests.",
        "Business Transfers: Information may be transferred in connection with any merger, sale, or acquisition of our company."
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        "All data is encrypted in transit and at rest using industry-standard encryption protocols.",
        "We regularly review and update our security practices to ensure the protection of your information.",
        "Access to personal information is restricted to employees who need it to perform their job functions."
      ]
    },
    {
      title: "Data Retention",
      content: [
        "We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.",
        "Account information is retained for the duration of your account and may be retained for a reasonable period after account closure for business purposes.",
        "Usage data may be retained in aggregated, anonymized form for analytical purposes.",
        "You may request deletion of your personal information by contacting us at privacy@llmoptimizer.com."
      ]
    },
    {
      title: "Your Rights and Choices",
      content: [
        "You have certain rights regarding your personal information, depending on your location.",
        "Access: You can request access to the personal information we hold about you.",
        "Correction: You can request that we correct inaccurate or incomplete information.",
        "Deletion: You can request that we delete your personal information, subject to certain exceptions.",
        "Portability: You can request a copy of your personal information in a structured, machine-readable format."
      ]
    },
    {
      title: "Cookies and Tracking Technologies",
      content: [
        "We use cookies and similar tracking technologies to provide and improve our services.",
        "Essential Cookies: Required for the platform to function properly.",
        "Analytics Cookies: Help us understand how users interact with our platform.",
        "Preference Cookies: Remember your settings and preferences.",
        "You can control cookie settings through your browser preferences."
      ]
    },
    {
      title: "International Data Transfers",
      content: [
        "Your information may be transferred to and processed in countries other than your country of residence.",
        "We ensure appropriate safeguards are in place when transferring personal information internationally.",
        "We comply with applicable data protection laws regarding international transfers.",
        "For EU residents, we ensure adequate protection through approved transfer mechanisms."
      ]
    },
    {
      title: "Children's Privacy",
      content: [
        "Our services are not directed to individuals under the age of 16.",
        "We do not knowingly collect personal information from children under 16.",
        "If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information.",
        "If you believe we have collected information from a child under 16, please contact us immediately."
      ]
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this privacy policy from time to time to reflect changes in our practices or applicable law.",
        "We will notify you of any material changes by posting the new policy on our website and updating the 'Last Updated' date.",
        "For significant changes, we may provide additional notice such as email notification.",
        "Your continued use of our services after any changes constitutes acceptance of the updated policy."
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
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Your privacy is important to us. This policy explains how we collect, 
              use, and protect your information when you use LLM Optimizer.
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
                LLM Optimizer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website and use our LLM optimization platform.
              </p>
              <p className="mb-6">
                This policy applies to all users of our services, including visitors to our website, 
                registered users of our platform, and customers who purchase our services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance 
                with this policy. If you do not agree with our policies and practices, do not use our services.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Policy Sections */}
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
              Questions about this policy?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, 
              please don&apos;t hesitate to contact us.
            </p>
            <div className="bg-gray-800 rounded-xl p-8 text-left max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4 text-gray-300">
                <p><strong className="text-white">Email:</strong> privacy@cleaversearch.com</p>
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