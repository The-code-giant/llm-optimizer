'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ForAgencies() {
  const benefits = [
    {
      icon: ChartBarIcon,
      title: "Scale Client Results",
      description: "Deliver consistent LLM optimization results across your entire client portfolio with automated workflows."
    },
    {
      icon: ClockIcon,
      title: "Save 80% Time",
      description: "Reduce manual optimization work from hours to minutes with AI-powered content analysis and recommendations."
    },
    {
      icon: UsersIcon,
      title: "White-Label Solution",
      description: "Brand our platform as your own with custom domains, logos, and client-facing dashboards."
    },
    {
      icon: SparklesIcon,
      title: "Premium Support",
      description: "Get dedicated account management, priority support, and custom training for your team."
    }
  ];

  const features = [
    {
      title: "Multi-Client Dashboard",
      description: "Manage all your clients from a single, powerful dashboard with role-based access controls.",
      icon: "📊"
    },
    {
      title: "Automated Reporting",
      description: "Generate beautiful, branded reports showing LLM citation improvements and ROI metrics.",
      icon: "📈"
    },
    {
      title: "Bulk Operations",
      description: "Optimize hundreds of pages across multiple client sites simultaneously.",
      icon: "⚡"
    },
    {
      title: "API Integration",
      description: "Integrate LLM optimization into your existing workflow with our comprehensive API.",
      icon: "🔗"
    },
    {
      title: "Team Collaboration",
      description: "Assign tasks, track progress, and collaborate with team members across all client projects.",
      icon: "👥"
    },
    {
      title: "Custom Branding",
      description: "White-label the entire platform with your agency's branding and custom domain.",
      icon: "🎨"
    }
  ];

  const caseStudy = {
    agency: "Digital Growth Partners",
    challenge: "Managing LLM optimization for 50+ e-commerce clients",
    solution: "Implemented Clever Search's agency solution with automated workflows",
    results: [
      "300% increase in LLM citations across client portfolio",
      "85% reduction in manual optimization time",
      "$2M+ additional revenue generated for clients",
      "40% improvement in client retention"
    ]
  };

  const pricing = [
    {
      name: "Agency Starter",
      price: "$499",
      period: "/month",
      description: "Perfect for growing agencies with 5-15 clients",
      features: [
        "Up to 15 client accounts",
        "10,000 page optimizations/month",
        "Basic white-labeling",
        "Email support",
        "Monthly reporting"
      ],
      popular: false
    },
    {
      name: "Agency Pro",
      price: "$999",
      period: "/month",
      description: "Ideal for established agencies with 15-50 clients",
      features: [
        "Up to 50 client accounts",
        "50,000 page optimizations/month",
        "Full white-labeling",
        "Priority support",
        "Custom reporting",
        "API access",
        "Team collaboration tools"
      ],
      popular: true
    },
    {
      name: "Agency Enterprise",
      price: "Custom",
      period: "",
      description: "For large agencies with 50+ clients",
      features: [
        "Unlimited client accounts",
        "Unlimited optimizations",
        "Complete customization",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
        "Training & onboarding"
      ],
      popular: false
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
              Scale LLM optimization
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                for your agency
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Deliver consistent LLM optimization results across your entire client portfolio. 
              White-label our platform and scale your services with automated workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/login"
                className="bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="border-2 border-white text-white hover:bg-white hover:text-black dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Schedule Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Built for agency success
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to deliver world-class LLM optimization services at scale.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Agency-focused features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed specifically for agencies managing multiple clients and projects.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Success story
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              See how {caseStudy.agency} transformed their client services with Clever Search.
            </p>
          </motion.div>

          <div className="bg-gray-900 rounded-2xl p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">{caseStudy.agency}</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Challenge</h4>
                    <p className="text-gray-300">{caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Solution</h4>
                    <p className="text-gray-300">{caseStudy.solution}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-6">Results</h4>
                <div className="space-y-4">
                  {caseStudy.results.map((result, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Agency pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Flexible plans that scale with your agency. All plans include white-labeling and client management tools.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-2xl p-8 relative ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href={plan.price === 'Custom' ? '/contact' : '/signin'}
                  className={`w-full rounded-full py-3 inline-flex items-center justify-center font-medium transition-colors duration-200 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Ready to scale your agency?
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Join hundreds of agencies already using Clever Search to deliver better results for their clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/login"
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Schedule Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 