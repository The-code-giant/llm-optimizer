'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  NewspaperIcon,
  CloudIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Solutions() {
  const solutions = [
    {
      icon: UserGroupIcon,
      title: "For Agencies",
      description: "Scale LLM optimization services across your client portfolio with white-label solutions and dedicated support.",
      features: [
        "White-label platform",
        "Client management tools",
        "Bulk optimization workflows",
        "Dedicated account manager"
      ],
      href: "/solutions/agencies",
      stats: { clients: "500+", growth: "3x faster", satisfaction: "98%" }
    },
    {
      icon: BuildingOfficeIcon,
      title: "For Enterprise",
      description: "Enterprise-grade LLM optimization with advanced security, custom integrations, and dedicated support.",
      features: [
        "SOC 2 Type II compliance",
        "Single sign-on (SSO)",
        "Custom integrations",
        "24/7 priority support"
      ],
      href: "/solutions/enterprise",
      stats: { security: "Enterprise", integrations: "50+", uptime: "99.9%" }
    },
    {
      icon: ShoppingBagIcon,
      title: "For E-commerce",
      description: "Optimize product listings and content to dominate AI-powered shopping searches and product recommendations.",
      features: [
        "Product catalog optimization",
        "Shopping query targeting",
        "Review content enhancement",
        "Conversion rate tracking"
      ],
      href: "/solutions/ecommerce",
      stats: { sales: "+40%", visibility: "5x higher", conversion: "+25%" }
    },
    {
      icon: NewspaperIcon,
      title: "For Publishers",
      description: "Maximize content discovery and reader engagement through AI-powered content recommendation systems.",
      features: [
        "Editorial content optimization",
        "Content distribution strategy",
        "Reader engagement analytics",
        "Revenue optimization"
      ],
      href: "/solutions/publishers",
      stats: { readership: "+60%", engagement: "3x longer", revenue: "+35%" }
    },
    {
      icon: CloudIcon,
      title: "For SaaS",
      description: "Drive qualified leads and product adoption through optimized content that AI systems recommend to prospects.",
      features: [
        "Feature documentation optimization",
        "Use case content strategy",
        "Trial conversion tracking",
        "Customer journey mapping"
      ],
      href: "/solutions/saas",
      stats: { leads: "+200%", trials: "+80%", retention: "+45%" }
    }
  ];

  const benefits = [
    {
      title: "Industry-Specific Optimization",
      description: "Tailored strategies for your industry's unique LLM citation patterns and user search behaviors."
    },
    {
      title: "Proven Results",
      description: "Our solutions have helped businesses across industries increase LLM citations by 300-500%."
    },
    {
      title: "Expert Support",
      description: "Get dedicated support from LLM optimization specialists who understand your industry."
    },
    {
      title: "Comprehensive Analytics",
      description: "Track your success with detailed analytics and reporting tailored to your business metrics."
    }
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
              Solutions for
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                every industry
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Specialized LLM optimization strategies designed for your industry's unique needs and challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 text-lg"
              >
                Explore Solutions
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

      {/* Solutions Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Choose your solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get industry-specific optimization strategies that deliver results for your unique business model.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 lg:p-10 hover:shadow-xl transition-all duration-300 border border-gray-200 group"
                >
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{solution.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{solution.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {solution.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <div className="flex space-x-6">
                      {Object.entries(solution.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-500 capitalize">{key}</div>
                        </div>
                      ))}
                    </div>
                    <Link href={solution.href}>
                      <Button className="bg-black text-white hover:bg-gray-800 rounded-full">
                        Learn More
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
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
              Why choose our solutions?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Industry-specific expertise meets cutting-edge LLM optimization technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
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
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Choose the solution that fits your industry and start optimizing for LLM citations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 text-lg"
              >
                Contact Sales
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