'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  ArrowLeftIcon,
  ClockIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  BookmarkIcon,
  ShareIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default function HelpArticle({ params }: ArticlePageProps) {
  // Convert slug back to title for display
  const titleFromSlug = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Article database - in a real app this would come from a CMS or API
  const getArticleContent = (slug: string) => {
    const articles: Record<string, any> = {
      'setting-up-your-first-site-analysis': {
        title: 'Setting up your first site analysis',
        category: 'Getting Started',
        readTime: '5 min read',
        lastUpdated: 'December 15, 2024',
        helpful: 245,
        content: `
# Setting up your first site analysis

Welcome to LLM Optimizer! This guide will walk you through setting up your first site analysis to start optimizing your content for AI citations.

## Overview

Site analysis is the foundation of LLM optimization. Our AI-powered system crawls your website, analyzes your content structure, and provides actionable recommendations to improve your visibility in ChatGPT, Claude, and Gemini responses.

## Step 1: Add Your Website

1. **Navigate to Dashboard**: After logging in, click "Add New Site" on your dashboard
2. **Enter Site URL**: Input your website's primary domain (e.g., https://yoursite.com)
3. **Verify Ownership**: We'll provide several verification methods:
   - HTML file upload
   - Meta tag insertion
   - DNS record verification
   - Google Analytics integration

## Step 2: Configure Analysis Settings

### Content Types
Select which content types to analyze:
- **Blog posts and articles** (recommended)
- **Product pages** (for e-commerce)
- **Service pages** (for B2B)
- **FAQ sections** (highly recommended)
- **About and company pages**

### Analysis Depth
Choose your analysis level:
- **Quick Scan**: Analyzes up to 100 pages (great for testing)
- **Standard Analysis**: Up to 1,000 pages (recommended for most sites)
- **Deep Analysis**: Up to 10,000 pages (for large sites)

## Step 3: Install Tracking

To monitor real-time performance, install our tracking script:

\`\`\`html
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://cdn.llmoptimizer.com/tracker.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','llmDataLayer','YOUR_SITE_ID');
</script>
\`\`\`

Add this script to your site's \`<head>\` section. Replace \`YOUR_SITE_ID\` with the ID provided in your dashboard.

## Step 4: Review Initial Results

After 24-48 hours, you'll receive:

### LLM Readiness Score
- **Overall score** (0-100)
- **Content structure** rating
- **AI-friendliness** assessment
- **Citation potential** analysis

### Detailed Recommendations
- **High-priority fixes** (immediate impact)
- **Content improvements** (medium-term)
- **Technical optimizations** (long-term)

## Step 5: Implement Recommendations

Start with high-priority recommendations:

1. **Fix structural issues** (missing headings, poor formatting)
2. **Add FAQ sections** (highest ROI for LLM citations)
3. **Optimize meta descriptions** (improve AI understanding)
4. **Enhance content depth** (comprehensive coverage beats shallow content)

## Common Issues and Solutions

### Low Content Score
**Problem**: Your content isn't structured for AI consumption
**Solution**: 
- Add clear headings (H1, H2, H3)
- Use bullet points and numbered lists
- Include definitive statements
- Add FAQ sections

### Poor Citation Potential
**Problem**: Content lacks authority signals
**Solution**:
- Add author information
- Include publication dates
- Link to authoritative sources
- Add customer testimonials

### Technical Errors
**Problem**: Site structure issues prevent proper analysis
**Solution**:
- Check robots.txt file
- Ensure XML sitemap is accessible
- Fix broken internal links
- Improve page load speeds

## Next Steps

Once your initial analysis is complete:

1. **Review the recommendations** in priority order
2. **Implement high-impact changes** first
3. **Monitor your LLM Readiness Score** improvements
4. **Set up automated monitoring** for ongoing optimization

## Need Help?

If you encounter any issues during setup:
- Check our [troubleshooting guide](/help/article/common-integration-problems)
- Contact support via live chat
- Schedule a personalized onboarding call

Remember: LLM optimization is an ongoing process. Regular monitoring and updates will help maintain and improve your AI citation performance over time.
        `
      },
      'understanding-your-llm-readiness-score': {
        title: 'Understanding your LLM readiness score',
        category: 'Getting Started',
        readTime: '8 min read',
        lastUpdated: 'December 14, 2024',
        helpful: 189,
        content: `
# Understanding your LLM readiness score

Your LLM Readiness Score is a comprehensive metric that evaluates how well your content is optimized for AI citation. This guide explains what the score means and how to improve it.

## What is the LLM Readiness Score?

The LLM Readiness Score is a 0-100 rating that measures your website's potential to be cited by AI assistants like ChatGPT, Claude, and Gemini. The score is calculated using over 50 different factors that influence AI citation behavior.

## Score Breakdown

### Overall Score Ranges
- **90-100**: Excellent - Your content is highly optimized for AI citation
- **70-89**: Good - Minor improvements needed
- **50-69**: Fair - Moderate optimization required
- **30-49**: Poor - Significant improvements needed
- **0-29**: Critical - Major restructuring required

### Component Scores

Your overall score is made up of five key components:

#### 1. Content Structure (25% weight)
Measures how well your content is organized for AI consumption:
- **Heading hierarchy** (H1, H2, H3 usage)
- **Paragraph length** (optimal: 50-150 words)
- **List usage** (bullet points, numbered lists)
- **Table of contents** presence
- **Internal linking** structure

#### 2. AI-Friendly Formatting (20% weight)
Evaluates formatting that AI systems prefer:
- **Clear topic sentences**
- **Definitive statements** vs. uncertain language
- **FAQ sections** (highest impact)
- **Key information highlighting**
- **Scannable content** structure

#### 3. Authority Signals (20% weight)
Measures credibility indicators:
- **Author information** and credentials
- **Publication dates** and freshness
- **External source citations**
- **Domain authority** factors
- **User engagement** metrics

#### 4. Technical Optimization (20% weight)
Assesses technical factors:
- **Page load speed** (under 3 seconds ideal)
- **Mobile responsiveness**
- **Schema markup** implementation
- **XML sitemap** quality
- **Crawlability** factors

#### 5. Content Depth (15% weight)
Evaluates comprehensiveness:
- **Topic coverage** breadth
- **Answer completeness**
- **Related questions** addressed
- **Use case examples**
- **Actionable insights** provided

## Detailed Metrics

### Content Quality Indicators

**Readability Score**: Based on sentence complexity and vocabulary
- Target: 8th-12th grade reading level
- AI systems prefer clear, accessible language

**Keyword Density**: Natural keyword usage without stuffing
- Target: 1-3% for primary keywords
- Focus on semantic relevance over density

**Content Length**: Optimal length varies by content type
- **Blog posts**: 1,500-3,000 words
- **Product pages**: 300-800 words
- **FAQ answers**: 50-200 words per question

### AI Citation Factors

**Question Coverage**: How well you answer common questions
- Analyze search queries in your niche
- Address "who, what, when, where, why, how"
- Include long-tail question variations

**Factual Accuracy**: Verifiable information quality
- Cite authoritative sources
- Include statistics and data
- Update information regularly

**Unique Value**: Original insights and perspectives
- Share proprietary data
- Provide expert opinions
- Offer unique solutions

## Improving Your Score

### Quick Wins (1-2 weeks)

1. **Add FAQ sections** to key pages
   - Impact: +10-15 points
   - Time: 2-4 hours per page

2. **Optimize heading structure**
   - Impact: +5-10 points
   - Time: 1-2 hours per page

3. **Add author information**
   - Impact: +3-8 points
   - Time: 30 minutes per page

### Medium-term Improvements (1-2 months)

1. **Expand content depth**
   - Impact: +15-25 points
   - Time: 4-8 hours per page

2. **Implement schema markup**
   - Impact: +8-12 points
   - Time: 2-3 days for site-wide implementation

3. **Improve internal linking**
   - Impact: +5-15 points
   - Time: 1-2 weeks for comprehensive audit

### Long-term Optimization (3-6 months)

1. **Build topical authority**
   - Impact: +20-30 points
   - Time: Ongoing content creation

2. **Enhance user engagement**
   - Impact: +10-20 points
   - Time: UX improvements and content quality

## Monitoring Your Progress

### Daily Monitoring
- Track score changes after content updates
- Monitor new content performance
- Check for technical issues

### Weekly Analysis
- Review component score trends
- Identify top-performing content
- Plan optimization priorities

### Monthly Reporting
- Analyze overall progress
- Compare to competitors
- Adjust strategy based on results

## Common Score Issues

### Low Structure Score
**Symptoms**: Poor heading usage, long paragraphs, no lists
**Solutions**: 
- Break content into scannable sections
- Use descriptive headings
- Add bullet points and numbered lists

### Poor Authority Score
**Symptoms**: Missing author info, no citations, outdated content
**Solutions**:
- Add comprehensive author bios
- Cite authoritative sources
- Update content regularly

### Technical Problems
**Symptoms**: Slow loading, mobile issues, crawl errors
**Solutions**:
- Optimize images and code
- Fix responsive design issues
- Resolve crawlability problems

## Best Practices

1. **Focus on user value first** - AI systems reward helpful content
2. **Update content regularly** - Freshness matters for citations
3. **Monitor competitor scores** - Stay ahead of your competition
4. **Test changes incrementally** - Track what works for your audience
5. **Maintain consistency** - Apply optimizations site-wide

Your LLM Readiness Score is a powerful tool for improving AI visibility. Regular monitoring and optimization will help you stay ahead in the evolving landscape of AI-powered search and discovery.
        `
      },
      'how-to-improve-your-llm-readiness-score': {
        title: 'How to improve your LLM readiness score',
        category: 'Optimization',
        readTime: '5 min read',
        lastUpdated: 'December 13, 2024',
        helpful: 245,
        content: `
# How to improve your LLM readiness score

Improving your LLM Readiness Score is the fastest way to increase your visibility in AI assistant responses. This guide provides actionable steps to boost your score quickly and effectively.

## Quick Wins (Implement Today)

### 1. Add FAQ Sections
**Impact**: +10-15 points
**Time Required**: 2-4 hours per page

FAQ sections are the highest-ROI optimization for LLM citations. AI systems love Q&A formats because they directly match user query patterns.

**How to implement**:
- Identify common questions your audience asks
- Create clear, concise answers (50-200 words each)
- Use natural language that matches how people speak to AI
- Place FAQs prominently on relevant pages

**Example FAQ structure**:
\`\`\`
Q: How long does it take to see results from LLM optimization?
A: Most websites see initial improvements in LLM citations within 2-4 weeks of implementing optimizations. Significant results typically appear within 2-3 months of consistent optimization efforts.
\`\`\`

### 2. Optimize Your Heading Structure
**Impact**: +5-10 points
**Time Required**: 1-2 hours per page

Proper heading hierarchy helps AI systems understand your content organization.

**Best practices**:
- Use only one H1 per page (your main title)
- Create logical H2 sections for main topics
- Use H3s for subtopics under each H2
- Make headings descriptive and keyword-rich
- Avoid skipping heading levels (don't go H1 → H3)

### 3. Add Author Information
**Impact**: +3-8 points
**Time Required**: 30 minutes per page

Authority signals significantly impact AI citation likelihood.

**Include**:
- Author name and credentials
- Publication date and last updated date
- Author bio with relevant expertise
- Contact information or social links

## Medium-Impact Improvements (1-2 weeks)

### 4. Enhance Content Structure
**Impact**: +8-15 points

Break up long paragraphs and improve scannability:
- Keep paragraphs to 3-4 sentences maximum
- Use bullet points for lists
- Add numbered steps for processes
- Include relevant subheadings every 200-300 words
- Use bold text to highlight key points

### 5. Implement Schema Markup
**Impact**: +8-12 points

Help AI systems better understand your content:

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-12-15",
  "dateModified": "2024-12-15"
}
</script>
\`\`\`

### 6. Optimize for Featured Snippets
**Impact**: +10-20 points

AI systems often reference content that performs well in featured snippets:
- Answer questions directly and concisely
- Use the question as a heading
- Provide the answer in the first paragraph
- Include supporting details below

## Long-Term Strategies (1-3 months)

### 7. Build Topical Authority
**Impact**: +20-30 points

Become the go-to source in your niche:
- Create comprehensive content clusters around main topics
- Link related articles together
- Cover topics from multiple angles
- Update content regularly with new insights

### 8. Improve Content Depth
**Impact**: +15-25 points

AI systems prefer comprehensive, authoritative content:
- Aim for 1,500+ words for main topic pages
- Cover all aspects of a topic thoroughly
- Include examples, case studies, and data
- Address common objections and concerns

### 9. Enhance User Engagement
**Impact**: +10-20 points

Engagement signals influence AI citation decisions:
- Improve page load speed (target under 3 seconds)
- Optimize for mobile devices
- Add interactive elements where appropriate
- Encourage social sharing and comments

## Technical Optimizations

### 10. Fix Crawlability Issues
**Impact**: +5-15 points

Ensure AI systems can access your content:
- Submit XML sitemaps to search engines
- Fix broken internal links
- Optimize robots.txt file
- Ensure proper URL structure

### 11. Optimize Page Speed
**Impact**: +5-10 points

Faster pages get better AI treatment:
- Compress images
- Minimize CSS and JavaScript
- Use content delivery networks (CDNs)
- Enable browser caching

## Content Quality Improvements

### 12. Use Definitive Language
**Impact**: +5-10 points

AI systems prefer confident, factual statements:
- Replace "might be" with "is"
- Use "will" instead of "could"
- Make clear, authoritative claims
- Back up statements with evidence

### 13. Add Data and Statistics
**Impact**: +8-15 points

Quantitative information increases citation likelihood:
- Include relevant industry statistics
- Share survey results or research findings
- Provide specific numbers and percentages
- Cite authoritative sources for data

## Monitoring Your Progress

### Track These Metrics Weekly:
- Overall LLM Readiness Score
- Individual component scores
- Page-level improvements
- Competitor score comparisons

### Use Our Tools:
- **Score Tracker**: Monitor daily score changes
- **Recommendation Engine**: Get personalized optimization suggestions
- **Competitor Analysis**: See how you stack up against competitors
- **Progress Reports**: Track improvements over time

## Common Mistakes to Avoid

1. **Keyword stuffing**: Focus on natural language over keyword density
2. **Ignoring mobile**: Ensure all optimizations work on mobile devices
3. **Neglecting freshness**: Update content regularly to maintain relevance
4. **Over-optimizing**: Maintain readability while optimizing for AI
5. **Forgetting user intent**: Always prioritize user value over AI optimization

## Prioritization Framework

**Week 1**: Add FAQs to top 5 pages
**Week 2**: Fix heading structure site-wide
**Week 3**: Add author information and dates
**Week 4**: Implement schema markup
**Month 2**: Focus on content depth and structure
**Month 3**: Build topical authority and engagement

Remember: Consistent, incremental improvements outperform sporadic major changes. Focus on one optimization at a time and measure results before moving to the next improvement.
        `
      }
    };

    // Default article if slug not found
    const defaultArticle = {
      title: titleFromSlug(slug),
      category: 'Help',
      readTime: '5 min read',
      lastUpdated: 'December 15, 2024',
      helpful: 0,
      content: `
# ${titleFromSlug(slug)}

This help article is currently being written. Our team is working on providing comprehensive documentation for all features and processes.

## What you can do now

While we prepare this content, here are some alternative resources:

### Quick Solutions
- Check our [FAQ section](/help) for common questions
- Contact our support team via live chat
- Browse related articles in the help center

### Get Personal Help
- Schedule a demo with our team
- Join our community forum
- Watch our video tutorials

## Coming Soon

This article will cover:
- Step-by-step instructions
- Best practices and tips
- Common troubleshooting scenarios
- Advanced configuration options

We appreciate your patience as we build out our comprehensive help documentation.

### Need Immediate Help?

If you need assistance with this topic right away:
1. Contact support via the chat widget
2. Email us at hello@llmoptimizer.com
3. Schedule a call with our team

Our support team is available 24/7 to help you succeed with LLM optimization.
      `
    };

    return articles[slug] || defaultArticle;
  };

  const article = getArticleContent(params.slug);

  const relatedArticles = [
    {
      title: "Understanding LLM citation patterns",
      category: "Analytics",
      readTime: "12 min read",
      href: "/help/article/understanding-llm-citation-patterns"
    },
    {
      title: "Best practices for AI-friendly content structure",
      category: "Strategy", 
      readTime: "10 min read",
      href: "/help/article/best-practices-for-ai-friendly-content-structure"
    },
    {
      title: "Troubleshooting tracker script installation",
      category: "Technical",
      readTime: "6 min read", 
      href: "/help/article/troubleshooting-tracker-script-installation"
    }
  ];

  const formatContent = (content: string) => {
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-4xl font-bold text-gray-900 mb-8 mt-12 first:mt-0">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-3xl font-bold text-gray-900 mb-6 mt-10">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-2xl font-bold text-gray-900 mb-4 mt-8">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        return (
          <h4 key={index} className="text-xl font-bold text-gray-900 mb-4 mt-6">
            {line.replace('#### ', '')}
          </h4>
        );
      } else if (line.startsWith('```')) {
        const isClosing = index > 0 && lines[index - 1] && !lines[index - 1].startsWith('```');
        if (isClosing) {
          return <div key={index}></div>; // Closing tag, handled by opening
        }
        
        // Find closing ```
        let codeContent = [];
        let closingIndex = index + 1;
        while (closingIndex < lines.length && !lines[closingIndex].startsWith('```')) {
          codeContent.push(lines[closingIndex]);
          closingIndex++;
        }
        
        return (
          <pre key={index} className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto my-6">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
      } else if (line.startsWith('- ')) {
        return (
          <li key={index} className="text-gray-700 leading-relaxed mb-2">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.match(/^\d+\. /)) {
        return (
          <li key={index} className="text-gray-700 leading-relaxed mb-2">
            {line.replace(/^\d+\. /, '')}
          </li>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="font-bold text-gray-900 mb-4 mt-6">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.trim() === '') {
        return <div key={index} className="mb-4"></div>;
      } else {
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4">
            {line}
          </p>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Breadcrumb */}
      <section className="pt-24 pb-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/help" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Help Center
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
                {article.category}
              </span>
              <span className="text-gray-500">{article.readTime}</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center justify-between pb-8 border-b border-gray-200">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>Last updated: {article.lastUpdated}</span>
                </div>
                {article.helpful > 0 && (
                  <>
                    <div className="text-gray-400">•</div>
                    <span>{article.helpful} people found this helpful</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
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
            <div className="text-gray-700 leading-relaxed">
              {formatContent(article.content)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Was this helpful? */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="rounded-lg">
                <HandThumbUpIcon className="w-4 h-4 mr-2" />
                Yes
              </Button>
              <Button variant="outline" className="rounded-lg">
                <HandThumbDownIcon className="w-4 h-4 mr-2" />
                No
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
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
              Continue learning with these helpful resources.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {relatedArticles.map((relatedArticle, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300"
              >
                <Link href={relatedArticle.href} className="block">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {relatedArticle.category}
                    </span>
                    <span className="text-gray-500 text-sm">{relatedArticle.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight hover:text-blue-600 transition-colors duration-200">
                    {relatedArticle.title}
                  </h3>
                  <div className="flex items-center text-blue-600">
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Read article</span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Still need help?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Our support team is here to help you succeed with LLM optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4"
                >
                  Contact Support
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4"
              >
                Live Chat
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 