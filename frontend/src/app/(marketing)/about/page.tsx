'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  SparklesIcon,
  UserGroupIcon,
  TrophyIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function About() {
  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Co-Founder",
      description: "Former AI researcher at Google with 10+ years in machine learning and content optimization.",
      avatar: "👨‍💼"
    },
    {
      name: "Sarah Johnson",
      role: "CTO & Co-Founder", 
      description: "Ex-OpenAI engineer specializing in large language models and AI system optimization.",
      avatar: "👩‍💻"
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Product",
      description: "Previously led product at several successful SaaS companies with expertise in AI-driven tools.",
      avatar: "👨‍🎨"
    },
    {
      name: "Emma Thompson",
      role: "Head of Marketing",
      description: "Content marketing expert who has helped 500+ companies optimize for search and AI platforms.",
      avatar: "👩‍💼"
    }
  ];

  const values = [
    {
      icon: SparklesIcon,
      title: "Innovation First",
      description: "We stay ahead of AI trends to provide cutting-edge optimization solutions for our users."
    },
    {
      icon: UserGroupIcon,
      title: "User-Centric",
      description: "Every feature we build is designed with our users' success and ease-of-use in mind."
    },
    {
      icon: TrophyIcon,
      title: "Results Driven",
      description: "We measure our success by the real impact we create for businesses and their AI visibility."
    },
    {
      icon: RocketLaunchIcon,
      title: "Fast Execution",
      description: "In the rapidly evolving AI landscape, speed and agility are crucial for staying competitive."
    }
  ];

  const stats = [
    { number: "10K+", label: "Websites Optimized" },
    { number: "500+", label: "Enterprise Clients" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "Support Available" }
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
              We&apos;re building the future of AI visibility.
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Cleversearch was founded to help businesses adapt to the AI-first world where 
              ChatGPT, Claude, and Gemini are becoming primary sources of information discovery.
            </p>
            <Link href="/contact">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Get in touch
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900 leading-tight">
                Our mission is simple.
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We believe every business deserves to be discovered and cited by AI systems. 
                As large language models become the primary way people find information, 
                traditional SEO isn&apos;t enough.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Cleversearch bridges this gap by providing the tools and insights needed 
                to optimize content specifically for AI understanding and citation, ensuring 
                businesses remain visible in the AI-driven future.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Make AI optimization accessible to non-technical users</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Provide real-time insights into LLM citation patterns</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Enable rapid content optimization and deployment</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Founded in 2024</h3>
                <p className="text-blue-100 mb-6">
                  Born from the realization that businesses needed specialized tools 
                  to succeed in the age of AI-powered information discovery.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">2024</div>
                    <div className="text-blue-200 text-sm">Founded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">$5M</div>
                    <div className="text-blue-200 text-sm">Seed Funding</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Our values drive everything we do.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These principles guide our product development, customer relationships, and company culture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Meet the team behind Clever Search.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our diverse team brings together expertise in AI, product development, and marketing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{member.avatar}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to join the AI optimization revolution?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Start optimizing your content for LLM citations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Get started free
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Contact sales
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