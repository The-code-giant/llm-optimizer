'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  TagIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function ForEcommerce() {
  const benefits = [
    {
      icon: ShoppingBagIcon,
      title: "Product Discovery",
      description: "Optimize product listings to appear in AI-powered shopping recommendations and product search results."
    },
    {
      icon: MagnifyingGlassIcon,
      title: "Shopping Query Optimization",
      description: "Target high-intent shopping queries to capture customers when they're ready to purchase."
    },
    {
      icon: ChartBarIcon,
      title: "Sales Analytics",
      description: "Track which LLM citations drive actual sales and optimize your highest-converting products first."
    },
    {
      icon: TagIcon,
      title: "Review Enhancement",
      description: "Automatically structure customer reviews to improve product credibility in AI responses."
    }
  ];

  const features = [
    {
      title: "Product Catalog Optimization",
      description: "Automatically optimize product titles, descriptions, and specifications for AI understanding",
      items: ["AI-friendly product descriptions", "Structured product data", "Category optimization", "Specification formatting"]
    },
    {
      title: "Shopping Intent Targeting",
      description: "Capture high-intent shoppers when they ask AI assistants for product recommendations",
      items: ["Purchase intent keywords", "Comparison optimization", "Feature highlighting", "Price positioning"]
    },
    {
      title: "Review & Rating Integration",
      description: "Leverage customer feedback to build trust and authority in AI recommendation systems",
      items: ["Review content structuring", "Rating signal optimization", "Q&A optimization", "Trust signal enhancement"]
    },
    {
      title: "Performance Tracking",
      description: "Monitor how AI citations translate to actual sales and customer acquisition",
      items: ["Sales attribution tracking", "Conversion rate analysis", "Customer journey mapping", "ROI measurement"]
    }
  ];

  const testimonials = [
    {
      company: "TechMart",
      industry: "Electronics",
      quote: "Our product visibility in AI shopping recommendations increased by 400%. ChatGPT now recommends our laptops for business use cases.",
      author: "Sarah Chen",
      role: "VP of Marketing",
      results: "+400% AI visibility"
    },
    {
      company: "HomeStyle",
      industry: "Furniture",
      quote: "LLM optimization helped us capture the 'work from home' furniture market. Sales from AI referrals grew 250% in 3 months.",
      author: "Mike Rodriguez",
      role: "E-commerce Director",
      results: "+250% AI-driven sales"
    }
  ];

  const stats = [
    { value: "40%", label: "Average sales increase" },
    { value: "5x", label: "Higher product visibility" },
    { value: "25%", label: "Conversion rate improvement" },
    { value: "60%", label: "Faster product discovery" }
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
              E-commerce
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                LLM optimization
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Dominate AI-powered shopping searches and product recommendations. Get your products discovered 
              when customers ask ChatGPT, Claude, and Gemini for shopping advice.
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
                animate={{ opacity: 1, y: 0 }}
                
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
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Why e-commerce brands choose us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized optimization for product catalogs, shopping queries, and purchase intent targeting.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  
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
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Complete e-commerce optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to get your products discovered by AI shopping assistants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                
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

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Success stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how e-commerce brands are growing with LLM optimization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.company}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-2xl p-8"
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
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8">
              Start optimizing your products today
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join thousands of e-commerce brands using LLM optimization to increase sales and product discovery.
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