"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TechMartCaseStudy() {
  const metrics = [
    {
      value: "500%",
      label: "Increase in LLM Citations",
      subtext: "From 2-3 monthly mentions to 15+ weekly citations",
    },
    {
      value: "60 days",
      label: "Time to Results",
      subtext: "First improvements visible within 14 days",
    },
    {
      value: "85%",
      label: "LLM Readiness Score",
      subtext: "Up from 23% pre-optimization",
    },
    {
      value: "$2.4M",
      label: "Additional Revenue",
      subtext: "Attributed to AI-driven traffic increase",
    },
  ];

  const timeline = [
    {
      phase: "Week 1-2: Discovery & Setup",
      items: [
        "Installed Clever Search tracker across 15,000+ product pages",
        "Conducted comprehensive site audit and LLM readiness assessment",
        "Identified key optimization opportunities in product descriptions and FAQ sections",
      ],
    },
    {
      phase: "Week 3-4: Content Optimization",
      items: [
        "Restructured product descriptions for better AI comprehension",
        "Added 250+ AI-optimized FAQ entries across product categories",
        "Implemented structured data markup for enhanced machine readability",
      ],
    },
    {
      phase: "Week 5-8: Implementation & Monitoring",
      items: [
        "Deployed optimized content using Clever Search's injection system",
        "Monitored LLM citation tracking and adjusted content strategy",
        "Achieved 85% LLM readiness score across all monitored pages",
      ],
    },
  ];

  const challenges = [
    {
      title: "Invisible to AI Assistants",
      description:
        "TechMart's products rarely appeared in ChatGPT or Claude responses, despite strong traditional SEO rankings.",
      icon: "👻",
    },
    {
      title: "Complex Technical Content",
      description:
        "Product specifications were too technical for AI models to easily parse and recommend to users.",
      icon: "🔧",
    },
    {
      title: "Fragmented Information",
      description:
        "Key product details were scattered across multiple pages, making it hard for LLMs to provide comprehensive answers.",
      icon: "🧩",
    },
  ];

  const solutions = [
    {
      title: "AI-Friendly Product Descriptions",
      description:
        "Rewrote 5,000+ product descriptions using natural language that AI models can easily understand and cite.",
      impact: "300% increase in product-specific LLM citations",
    },
    {
      title: "Comprehensive FAQ System",
      description:
        "Created targeted FAQ sections addressing common customer questions in formats optimized for AI consumption.",
      impact: "85% of customer queries now answered by AI assistants",
    },
    {
      title: "Structured Data Implementation",
      description:
        "Added rich schema markup and structured data to help AI models better understand product relationships.",
      impact: "92% improvement in context accuracy when cited",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              href="/case-studies"
              className="inline-flex items-center text-blue-200 hover:text-white mb-8 transition-colors"
            >
              ← Back to Case Studies
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">🛍️</span>
                  <div>
                    <div className="text-blue-200 text-lg font-medium">
                      E-commerce
                    </div>
                    <div className="text-2xl font-bold">TechMart</div>
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How TechMart Increased LLM Citations by 500% in Just 60 Days
                </h1>

                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Discover how this leading electronics retailer transformed
                  their AI visibility and generated $2.4M in additional revenue
                  by optimizing for LLM citations.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Download Full Report
                  </Button> */}
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-black hover:bg-white hover:text-blue-600"
                    >
                      Schedule Similar Results Call
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-center"
                  >
                    <div className="text-3xl font-bold mb-2 text-gray-900">
                      {metric.value}
                    </div>
                    <div className="text-gray-700 text-sm font-medium mb-2">
                      {metric.label}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {metric.subtext}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  About TechMart
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  TechMart is a leading online electronics retailer with over
                  15,000 products ranging from smartphones and laptops to smart
                  home devices and gaming equipment. Founded in 2018,
                  they&apos;ve built a reputation for competitive pricing and
                  excellent customer service, serving over 500,000 customers
                  annually.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  As AI assistants became more popular for product research,
                  TechMart noticed a concerning trend: their products were
                  rarely being recommended by ChatGPT, Claude, or other AI
                  tools, despite having strong traditional search rankings and
                  competitive prices.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Company Stats
              </h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-blue-600">
                    15,000+
                  </div>
                  <div className="text-gray-600">Products</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-blue-600">500K+</div>
                  <div className="text-gray-600">Annual Customers</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-blue-600">$85M</div>
                  <div className="text-gray-600">Annual Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    6 years
                  </div>
                  <div className="text-gray-600">In Business</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              The Challenge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Despite strong traditional SEO performance, TechMart was virtually
              invisible to AI assistants, missing out on the growing trend of
              AI-powered product research.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="text-5xl mb-6">{challenge.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {challenge.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {challenge.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              The Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Using Clever Search&apos;s comprehensive LLM optimization
              platform, TechMart implemented a data-driven strategy to become
              AI-assistant friendly.
            </p>
          </motion.div>

          <div className="space-y-12">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="grid lg:grid-cols-3 gap-8 items-center">
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {solution.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {solution.description}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      Result
                    </div>
                    <div className="text-gray-700 font-medium">
                      {solution.impact}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Implementation Timeline
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how TechMart achieved remarkable results in just 8 weeks with
              a structured, phase-by-phase approach.
            </p>
          </motion.div>

          <div className="space-y-8">
            {timeline.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {phase.phase}
                </h3>
                <ul className="space-y-3">
                  {phase.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Quote */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <blockquote className="text-2xl lg:text-3xl font-light mb-8 leading-relaxed">
              &ldquo;The results have been absolutely incredible. We went from
              being completely invisible to AI assistants to being recommended
              multiple times per week. Our customers are now finding us through
              ChatGPT and Claude, and it&apos;s driving real revenue.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">Marcus Johnson</div>
                <div className="text-blue-200">
                  Head of Digital Marketing, TechMart
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              Ready to Achieve Similar Results?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join TechMart and hundreds of other companies seeing remarkable
              growth with LLM optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 px-8 py-3"
                >
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-black hover:bg-white hover:text-black px-8 py-3"
                >
                  Get a Custom Strategy
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
