'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import { 
  NewspaperIcon,
  UsersIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function ForPublishers() {
  const benefits = [
    {
      icon: NewspaperIcon,
      title: "Content Discovery",
      description: "Optimize articles and editorial content to be discovered and cited by AI systems across all topics."
    },
    {
      icon: UsersIcon,
      title: "Audience Expansion",
      description: "Reach new readers when AI assistants recommend your content for relevant queries and topics."
    },
    {
      icon: ChartBarIcon,
      title: "Engagement Analytics",
      description: "Track which content gets AI citations and how it drives reader engagement and subscriptions."
    },
    {
      icon: GlobeAltIcon,
      title: "Authority Building",
      description: "Establish your publication as a trusted source that AI systems cite for credible information."
    }
  ];

  const features = [
    {
      title: "Editorial Content Optimization",
      description: "Optimize news articles, features, and opinion pieces for maximum AI discoverability",
      items: ["Article structure optimization", "Headline formatting", "Quote and fact highlighting", "Source attribution"]
    },
    {
      title: "Content Distribution Strategy",
      description: "Get your stories discovered across multiple AI platforms and recommendation systems",
      items: ["Multi-platform optimization", "Topic authority building", "Breaking news optimization", "Evergreen content strategy"]
    },
    {
      title: "Reader Engagement Analytics",
      description: "Understand how AI citations drive traffic, subscriptions, and reader engagement",
      items: ["Citation source tracking", "Reader journey analysis", "Subscription attribution", "Engagement metrics"]
    },
    {
      title: "Revenue Optimization",
      description: "Maximize ad revenue and subscriptions from AI-driven traffic and reader acquisition",
      items: ["Premium content optimization", "Paywall strategy", "Ad placement optimization", "Revenue attribution"]
    }
  ];

  const testimonials = [
    {
      company: "Digital Tribune",
      industry: "News & Media",
      quote: "Our investigative journalism now gets cited by ChatGPT regularly. Reader engagement from AI referrals increased 300% in 4 months.",
      author: "Jennifer Walsh",
      role: "Editor-in-Chief",
      results: "+300% engagement"
    },
    {
      company: "Tech Today",
      industry: "Technology Publishing",
      quote: "LLM optimization helped us become the go-to source for AI technology news. Our subscription rate from AI traffic is 2x higher.",
      author: "David Kim",
      role: "Digital Director",
      results: "2x subscription rate"
    }
  ];

  const stats = [
    { value: "60%", label: "Increase in readership" },
    { value: "3x", label: "Longer engagement time" },
    { value: "35%", label: "Revenue growth" },
    { value: "45%", label: "More subscribers" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl lg:text-7xl font-normal mb-8 leading-tight">
              Publishers &
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                media optimization
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Maximize content discovery and reader engagement through AI-powered systems. Get your 
              journalism cited and recommended by ChatGPT, Claude, and Gemini.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 text-lg"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4 text-lg"
              >
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Why publishers choose us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized optimization for editorial content, reader engagement, and revenue growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Complete publishing optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to get your content discovered and cited by AI systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <div className="space-y-3">
                  {feature.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Perfect for all content types
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimize every piece of content in your editorial calendar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Breaking News",
                description: "Get immediate AI visibility for time-sensitive stories and breaking news coverage.",
                icon: "📰"
              },
              {
                title: "Investigative Reports",
                description: "Establish authority with in-depth journalism that AI systems cite as credible sources.",
                icon: "🔍"
              },
              {
                title: "Opinion & Editorial",
                description: "Share perspectives and analysis that AI systems reference for balanced viewpoints.",
                icon: "💭"
              },
              {
                title: "Feature Stories",
                description: "Optimize long-form content for maximum discoverability and reader engagement.",
                icon: "📖"
              },
              {
                title: "Interviews & Profiles",
                description: "Make expert interviews and profiles easily discoverable for relevant topics.",
                icon: "🎤"
              },
              {
                title: "Data Journalism",
                description: "Optimize research and data-driven stories that AI systems cite for facts and figures.",
                icon: "📊"
              }
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Success stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how publishers are growing readership with LLM optimization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.company}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                    <div className="text-sm text-gray-500">{testimonial.industry}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{testimonial.results}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8">
              Start optimizing your content today
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join leading publishers using LLM optimization to increase readership and revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 text-lg"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 