'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { ArrowRight, Bot, Code, Search, Target } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: <Bot className="w-8 h-8 text-blue-600" />,
      title: "LLM Citation Optimization",
      description: "Optimize your content to be cited by ChatGPT, Claude, and Gemini. Increase your visibility in AI-powered search results.",
      features: ["ChatGPT optimization", "Claude readiness", "Gemini citations", "AI-readiness scoring"]
    },
    {
      icon: <Code className="w-8 h-8 text-green-600" />,
      title: "Dynamic Content Injection",
      description: "Add AI-generated FAQs, definitions, and structured content to your pages without touching code.",
      features: ["No-code content updates", "AI-generated FAQs", "Smart definitions", "Structured data"]
    },
    {
      icon: <Search className="w-8 h-8 text-purple-600" />,
      title: "LLM Readiness Analysis",
      description: "Get detailed analysis of how well your content performs with Large Language Models.",
      features: ["Content scoring", "LLM analysis", "Actionable recommendations", "Performance tracking"]
    },
    {
      icon: <Target className="w-8 h-8 text-orange-600" />,
      title: "Tracker Script & Monitoring",
      description: "Lightweight JavaScript tracking to monitor and optimize your content for LLM visibility.",
      features: ["Simple script installation", "Real-time monitoring", "Content performance", "Sitemap analysis"]
    }
  ];

  const cities = [
    {
      province: "British Columbia",
      cities: [
        { name: "Vancouver", slug: "vancouver-bc", businesses: "500+" },
        { name: "Surrey", slug: "surrey-bc", businesses: "220+" },
        { name: "Burnaby", slug: "burnaby-bc", businesses: "190+" },
        { name: "Victoria", slug: "victoria-bc", businesses: "180+" }
      ]
    },
    {
      province: "Alberta", 
      cities: [
        { name: "Calgary", slug: "calgary-alberta", businesses: "300+" },
        { name: "Edmonton", slug: "edmonton-alberta", businesses: "250+" }
      ]
    },
    {
      province: "Ontario",
      cities: [
        { name: "Toronto", slug: "toronto-ontario", businesses: "800+" },
        { name: "Ottawa", slug: "ottawa-ontario", businesses: "400+" },
        { name: "Hamilton", slug: "hamilton-ontario", businesses: "280+" },
        { name: "London", slug: "london-ontario", businesses: "220+" },
        { name: "Kitchener", slug: "kitchener-ontario", businesses: "180+" },
        { name: "Windsor", slug: "windsor-ontario", businesses: "160+" },
        { name: "Mississauga", slug: "mississauga-ontario", businesses: "350+" },
        { name: "Markham", slug: "markham-ontario", businesses: "200+" }
      ]
    }
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
                              Clever Search Services
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Optimize your website content for ChatGPT, Claude, and Gemini citations. 
              Increase your visibility in AI-powered search results with our specialized LLM optimization platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
                  Start Free Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white text-black hover:bg-white hover:text-black rounded-full px-8 py-3">
                  Contact LLM Experts
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Services */}
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
              LLM Optimization Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive solutions to optimize your content for large language models and AI-powered search.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="mb-6">{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-500 flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* City Services */}
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
              Local LLM Optimization Experts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Specialized LLM optimization services for businesses across Canada. 
              Our experts understand local markets and how to optimize content for maximum AI citations.
            </p>
          </motion.div>
          
          {cities.map((province, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="mb-16"
            >
              <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800">
                {province.province}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {province.cities.map((city, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-300 text-center h-full">
                      <h4 className="text-xl font-semibold mb-3">{city.name}</h4>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{city.businesses}</div>
                      <p className="text-gray-600 mb-4">businesses optimized</p>
                      <p className="text-sm text-gray-500 mb-6">
                        LLM citation optimization specialists
                      </p>
                      <Link href={`/services/${city.slug}`}>
                        <Button variant="outline" size="sm" className="w-full hover:bg-black hover:text-white transition-colors">
                          View {city.name} Services
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
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
              Ready to Optimize for LLM Citations?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                              Join 1,000+ businesses using our Clever Search to increase ChatGPT, Claude, and Gemini citations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
                  Start Free LLM Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3">
                  Speak with LLM Expert
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