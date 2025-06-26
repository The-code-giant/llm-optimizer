'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  CalendarIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function BlogPost() {
  // This would normally come from props or API
  const post = {
    title: "The Complete Guide to LLM Optimization in 2024",
    excerpt: "Everything you need to know about optimizing your content for ChatGPT, Claude, and Gemini citations. From basic principles to advanced strategies.",
    author: "Sarah Chen",
    authorRole: "Head of AI Research",
    authorAvatar: "👩‍💻",
    date: "December 15, 2024",
    readTime: "12 min read",
    category: "Guide",
    tags: ["LLM", "AI SEO", "Content Optimization", "ChatGPT", "Claude"],
    content: `
Large Language Models (LLMs) are fundamentally changing how people discover and consume information. As AI assistants like ChatGPT, Claude, and Gemini become primary sources for answers, businesses must adapt their content strategies to remain visible in this new landscape.

## Understanding LLM Citation Patterns

When users ask questions to AI assistants, these systems don't just generate responses from thin air. They reference and cite content from across the web, making some sources more visible than others. Understanding how LLMs select and cite sources is crucial for optimization.

### Key Factors in LLM Citations

1. **Content Structure**: Well-structured content with clear headings and logical flow
2. **Authority Signals**: Domain authority, backlinks, and content credibility
3. **Relevance**: How closely content matches user queries
4. **Freshness**: Recent, up-to-date information
5. **Comprehensiveness**: Detailed, thorough coverage of topics

## Optimizing Content Structure for AI

### Use Clear, Hierarchical Headings

LLMs parse content better when it follows a clear hierarchy. Use H1 for main titles, H2 for major sections, and H3 for subsections. This helps AI systems understand the content structure and extract relevant information.

### Write Definitive Statements

AI systems prefer content that makes clear, definitive statements. Instead of "might be" or "could be," use "is" and "are" when stating facts. This increases the likelihood of citation.

### Include Comprehensive Answers

When addressing topics, provide complete answers that cover multiple angles. LLMs favor content that thoroughly addresses user questions without requiring additional sources.

## Technical Implementation

### Schema Markup

Implement structured data to help AI systems understand your content context:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-12-15"
}
\`\`\`

### FAQ Sections

Include FAQ sections that directly answer common questions. This format is particularly effective for LLM optimization as it matches how users query AI systems.

### Content Freshness

Regularly update your content to maintain freshness signals. LLMs often prefer recent information, especially for topics that change frequently.

## Measuring Success

Track these key metrics to measure your LLM optimization success:

- **Citation Rate**: How often your content is referenced by AI systems
- **Visibility Score**: Your presence in AI-generated responses
- **Traffic from AI**: Direct referrals from AI platforms
- **Brand Mentions**: How often your brand appears in AI responses

## Advanced Strategies

### Multi-Modal Optimization

As AI systems become more sophisticated, optimize for multiple content types:
- Text content for traditional citations
- Images with proper alt text and captions
- Video content with transcripts
- Audio content with descriptions

### Platform-Specific Optimization

Different AI platforms have varying preferences:
- **ChatGPT**: Favors comprehensive, well-structured content
- **Claude**: Prefers authoritative sources with clear citations
- **Gemini**: Values fresh, relevant information with good user engagement

## Conclusion

LLM optimization represents the next evolution of content strategy. By understanding how AI systems process and cite content, businesses can position themselves for success in the AI-driven future.

The key is to create high-quality, well-structured content that serves both human readers and AI systems. Focus on authority, relevance, and comprehensive coverage to maximize your chances of being cited by LLMs.

Remember, LLM optimization is an ongoing process. As AI systems evolve, so too must your optimization strategies. Stay informed about changes in AI behavior and adjust your approach accordingly.
    `
  };

  const relatedPosts = [
    {
      title: "How We Increased LLM Citations by 400% in 30 Days",
      category: "Case Study",
      readTime: "8 min read",
      href: "/blog/increased-llm-citations-400-percent"
    },
    {
      title: "Understanding AI Search: How ChatGPT Finds Information",
      category: "Research",
      readTime: "15 min read",
      href: "/blog/understanding-ai-search-chatgpt"
    },
    {
      title: "AEO vs SEO: The Future of Content Optimization",
      category: "Strategy",
      readTime: "10 min read",
      href: "/blog/aeo-vs-seo-future-content-optimization"
    }
  ];

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
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {post.category}
              </span>
              <span className="text-gray-500">{post.readTime}</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between pb-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">{post.authorAvatar}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{post.author}</div>
                  <div className="text-gray-600 text-sm">{post.authorRole}</div>
                </div>
                <div className="text-gray-400">•</div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>{post.date}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="prose prose-lg max-w-none"
          >
            <div className="text-gray-700 leading-relaxed space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-3xl font-bold text-gray-900 mt-12 mb-6">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                } else if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                } else if (paragraph.startsWith('```')) {
                  return (
                    <pre key={index} className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto">
                      <code>{paragraph.replace(/```\w*\n?|\n?```/g, '')}</code>
                    </pre>
                  );
                } else if (paragraph.match(/^\d+\./)) {
                  return (
                    <div key={index} className="bg-blue-50 p-6 rounded-lg">
                      <p className="font-medium text-blue-900">{paragraph}</p>
                    </div>
                  );
                } else if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={index} className="list-disc list-inside space-y-2 bg-gray-50 p-6 rounded-lg">
                      <li className="text-gray-700">{paragraph.replace('- ', '')}</li>
                    </ul>
                  );
                } else {
                  return (
                    <p key={index} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tags */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <span className="text-gray-600 font-medium">Tags:</span>
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <p className="text-lg text-gray-600">
              Continue reading about LLM optimization strategies and best practices.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300"
              >
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
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Stay ahead of AI trends
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Get the latest insights on LLM optimization delivered to your inbox weekly.
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
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 