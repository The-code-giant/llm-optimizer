import React from 'react';
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import HeroSection from '@/components/hero-section';
import FAQs from '@/components/faqs';
import LogoCloud from '@/components/logo-cloud';
import AIOptimizationTabs from '@/components/ai-optimization-tabs';
import { 
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const stats = [
    { 
      number: 75, 
      suffix: "%", 
      label: "of users now ask LLMs for recommendations before making purchase decisions.", 
      source: "According to Recent Studies" 
    },
    { 
      number: 3, 
      suffix: "x", 
      label: "more likely to be cited when content follows LLM-optimized structure and formatting.", 
      source: "Clever Search Research" 
    },
    { 
      number: 85, 
      suffix: "%", 
      label: "of websites lack proper structure for LLM understanding and citation.", 
      source: "Industry Analysis" 
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section - Dark */}
      <HeroSection />
      <LogoCloud />
      <section id="pricing" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Why an AI search and discovery strategy is critical.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="text-6xl lg:text-7xl font-light text-gray-900 mb-4">
                  <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                </div>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed max-w-sm mx-auto">
                  {stat.label}
                </p>
                <p className="text-sm text-gray-500 underline">
                  {stat.source}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Optimization Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Complete AI optimization strategy.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Master all aspects of AI visibility with our comprehensive approach to SEO, AEO, GEO, and LLMO.
            </p>
          </motion.div>

          <AIOptimizationTabs />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Features that drive AI visibility.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and strategies to optimize your content for AI search engines and large language models.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                id: 'seo',
                title: 'AI SEO',
                icon: SparklesIcon,
                subtitle: 'Search Engine Optimization for AI',
                description: 'Optimize your content structure and metadata to reach new customers who are using AI for search. "AI-first SEO built for actionable insights."',
                features: [
                  'Auto-apply structured data so AI understands your content',
                  'Optimize hierarchy to maximize page-level scoring',
                  'Inject semantic keywords grounded in real AI prompts',
                  'Close technical SEO gaps based on crawler analytics'
                ],
                color: 'blue'
              },
              {
                id: 'aeo',
                title: 'AEO',
                icon: SparklesIcon,
                subtitle: 'Answer Engine Optimization',
                description: 'Structure your content to be the preferred source for AI-generated answers and responses.',
                features: [
                  'Question-answer format optimization',
                  'Featured snippet targeting for AI responses',
                  'Content formatting for direct answer extraction',
                  'Authority signals to increase citation probability'
                ],
                color: 'green'
              },
              {
                id: 'geo',
                title: 'GEO',
                icon: SparklesIcon,
                subtitle: 'Generative Engine Optimization',
                description: 'Optimize for generative AI platforms that create content based on multiple sources.',
                features: [
                  'Multi-source content validation and consistency',
                  'Cross-platform optimization for various AI models',
                  'Content freshness and update frequency optimization',
                  'Brand mention and citation tracking across AI platforms'
                ],
                color: 'purple'
              },
              {
                id: 'llmo',
                title: 'LLMO',
                icon: SparklesIcon,
                subtitle: 'Large Language Model Optimization',
                description: 'Specifically optimize for LLMs like ChatGPT, Claude, and Gemini to increase citation rates.',
                features: [
                  'LLM-specific content formatting and structure',
                  'Training data optimization strategies',
                  'Citation-worthy content creation guidelines',
                  'Real-time LLM response monitoring and adjustment'
                ],
                color: 'orange'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className={`w-2 h-2 bg-${feature.color}-500 rounded-full mt-2 mr-3 flex-shrink-0`}></div>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQs />

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-white">
              Ready to optimize for AI?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start getting cited by ChatGPT, Claude, and other AI platforms. 
              Join thousands of businesses already optimizing for the future of search.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 py-3 font-semibold"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 rounded-full px-8 py-3 font-semibold"
                >
                  Watch Demo
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
