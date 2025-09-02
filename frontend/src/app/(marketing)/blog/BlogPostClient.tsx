"use client";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';
import { BlogMeta } from "./BlogListClient";
import Image from "next/image";
interface BlogPostClientProps {
  meta: BlogMeta;
  relatedPosts: [{ title: string, href: string, category: string, readTime: string }];
  children: ReactNode;
}

export default function BlogPostClient({ meta, relatedPosts, children }: BlogPostClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Back Navigation */}
      <section className="pt-24 pb-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </section>
      {/* Article Header */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {meta.category}
              </span>
              <span className="text-gray-500">{meta.readTime}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {meta.title}
            </h1>
            {meta.featuredImage && (
              <img src={meta.featuredImage} alt={meta.title}/>
            )}
            <p className="text-xl text-gray-600 mb-8 mt-4 leading-relaxed">
              {meta.excerpt}
            </p>
            <div className="flex items-center justify-between pb-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {meta.avatar ? (
                    <Image src={meta.avatar} alt={meta.author} width={48} height={48} />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      N/A
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{meta.author}</div>
                  {meta.authorRole && <div className="text-gray-600 text-sm">{meta.authorRole}</div>}
                </div>
                <div className="text-gray-400">•</div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>{meta.date}</span>
                </div>
              </div>
              {/* Removed Share and Save buttons */}
            </div>
          </motion.div>
        </div>
      </section>
      {/* Article Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="prose prose-lg max-w-none">
            {children}
          </motion.div>
        </div>
      </section>
      {/* Tags */}
      {meta.tags && (
        <section className="py-8 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap gap-3">
              <span className="text-gray-600 font-medium">Tags:</span>
              {meta.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors duration-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Related Posts */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <p className="text-lg text-gray-600">
              Continue reading about LLM optimization strategies and best practices.
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, index) => (
              <motion.article key={index} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                <Link href={relatedPost.href} className="block">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {relatedPost.category}
                    </span>
                    <span className="text-gray-500 text-sm">{relatedPost.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight hover:text-blue-600 transition-colors duration-200">
                    {relatedPost.title}
                  </h3>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      {/* Newsletter CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Stay ahead of AI trends
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Get the latest insights on LLM optimization delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input type="email" placeholder="Enter your email" className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
} 