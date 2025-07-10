'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { ArrowRight, Bot, Code, Search, Target, CheckCircle, Users, TrendingUp } from "lucide-react";

export default function VictoriaLLMServices() {
  const stats = [
    { icon: <Users className="w-8 h-8 text-blue-600" />, number: "180+", label: "Victoria Businesses Optimized" },
    { icon: <TrendingUp className="w-8 h-8 text-green-600" />, number: "91%", label: "Average LLM Citation Increase" },
    { icon: <Bot className="w-8 h-8 text-purple-600" />, number: "24/7", label: "LLM Monitoring & Analysis" }
  ];

  const services = [
    {
      icon: <Bot className="w-8 h-8 text-blue-600" />,
      title: "LLM Citation Optimization",
      description: "Optimize your Victoria business content for ChatGPT, Claude, and Gemini citations. Perfect for BC government and tourism services.",
      features: ["BC government optimization", "Tourism content analysis", "Provincial service citations", "AI-readiness scoring"]
    },
    {
      icon: <Code className="w-8 h-8 text-green-600" />,
      title: "Dynamic Content Injection",
      description: "Add AI-generated FAQs, tourism definitions, and structured content to your Victoria business pages without coding.",
      features: ["No-code content updates", "Victoria-specific FAQs", "Tourism industry definitions", "Structured data injection"]
    },
    {
      icon: <Search className="w-8 h-8 text-purple-600" />,
      title: "LLM Readiness Analysis",
      description: "Comprehensive analysis optimized for Victoria's government and tourism sectors. See how well your content performs with LLMs.",
      features: ["Tourism sector scoring", "Victoria market analysis", "Government content optimization", "Performance tracking dashboard"]
    },
    {
      icon: <Target className="w-8 h-8 text-orange-600" />,
      title: "Tracker Script & Monitoring",
      description: "Provincial capital-grade tracking designed for Victoria's government environment. Monitor LLM performance in real-time.",
      features: ["Secure script installation", "Real-time LLM monitoring", "Tourism content metrics", "Automated sitemap analysis"]
    }
  ];

  const industries = [
    "BC Government",
    "Tourism & Hospitality", 
    "Professional Services",
    "Technology Companies",
    "Healthcare Organizations",
    "Education Sector"
  ];

  const testimonials = [
    {
      company: "Victoria BC Government",
      text: "Our provincial service content now gets cited by ChatGPT consistently. LLM Optimizer helped us optimize complex government documentation for AI understanding."
    },
    {
      company: "Victoria Tourism Company",
      text: "The platform's understanding of tourism and government terminology is impressive. Our Claude citations increased dramatically after implementation."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
              Victoria LLM Optimizer Services
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Specialized LLM optimization for Victoria's BC government and tourism sectors. Increase your ChatGPT, Claude, and Gemini citations 
              with content optimization designed for provincial services and tourism content. Trusted by 180+ Victoria organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
                  Start Free Victoria LLM Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3">
                  Contact Victoria LLM Team
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-8 text-center bg-gray-900 border-gray-800 text-white">
                  <div className="flex justify-center mb-4">{stat.icon}</div>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-6 text-gray-900 leading-tight">
              LLM Optimization Services for Victoria Businesses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive LLM optimization solutions tailored for Victoria's BC government and tourism sectors.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{service.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-500 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Victoria Industries */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-6 text-gray-900 leading-tight">
              Victoria Industries We Optimize for LLM Citations
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                  <h3 className="text-lg font-semibold mb-3">{industry}</h3>
                  <p className="text-gray-600 text-sm">
                    Specialized LLM optimization strategies for {industry.toLowerCase()}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-6 text-gray-900 leading-tight">
              How LLM Optimizer Works for Your Victoria Business
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "1", title: "Install Capital Script", description: "Add our BC capital-grade JavaScript snippet designed for Victoria's government environment" },
              { number: "2", title: "Import Your Sitemap", description: "We analyze all your government and tourism content using specialized LLM optimization algorithms" },
              { number: "3", title: "Get Capital Analysis", description: "Receive detailed government and tourism-optimized ChatGPT, Claude, and Gemini readiness scores" },
              { number: "4", title: "Inject Tourism Content", description: "Add AI-generated BC government FAQs and tourism definitions without any coding required" }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 text-center h-full">
                  <div className="text-3xl font-bold text-blue-600 mb-4">{step.number}</div>
                  <h3 className="font-semibold mb-4">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-6 text-gray-900 leading-tight">
              Victoria Businesses Love Our LLM Optimizer
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="p-8 h-full">
                  <blockquote className="text-lg italic text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                  <cite className="text-sm font-semibold text-gray-900">
                    — {testimonial.company}
                  </cite>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to Dominate Victoria's LLM Citations?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join 180+ Victoria organizations already using LLM Optimizer to increase their AI citations and tourism content visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
                  Start Free Victoria Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3">
                  Contact Victoria Team
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