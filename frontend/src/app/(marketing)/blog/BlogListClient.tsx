"use client";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

export interface BlogMeta {
  title: string;
  excerpt: string;
  author: string;
  avatar: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
  href: string;
}

interface BlogListClientProps {
  posts: BlogMeta[];
  featuredPost: BlogMeta;
  categories: { name: string; count: number; active?: boolean }[];
}

export default function BlogListClient({ posts, featuredPost, categories }: BlogListClientProps) {
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
            Cleversearch Insights
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with Cleversearch insights. Subscribe to our newsletter and get the latest AI search trends, strategies, and updates straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Subscribe to Newsletter
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`px-6 py-3 rounded-full font-medium transition-colors duration-200 ${
                  category.active
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </motion.button>
            ))}
          </div>
        </div>
      </section>
      {/* Featured Post */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Article</h2>
            <Link href={featuredPost.href} className="block">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 lg:p-12 text-white hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{featuredPost.image}</span>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {featuredPost.category}
                  </span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  {featuredPost.title}
                </h3>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-6 text-blue-200">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>
      {/* Blog Posts Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Latest Articles
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              Stay updated with the latest trends, strategies, and insights in LLM optimization.
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <Link href={post.href} className="block">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-3xl">{post.image}</span>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight hover:text-blue-600 transition-colors duration-200">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3"
            >
              Load More Articles
            </Button>
          </motion.div>
        </div>
      </section>
      {/* Newsletter Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Never miss an insight.
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Subscribe to our newsletter for the latest LLM optimization strategies, 
              case studies, and industry updates delivered weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 whitespace-nowrap"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Join 10,000+ professionals already subscribed. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
} 