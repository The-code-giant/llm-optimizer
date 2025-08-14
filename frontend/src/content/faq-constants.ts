import { type IconName } from 'lucide-react/dynamic';

export type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
  details?: string[];
  detailsType?: 'ol' | 'ul';
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'ai-seo-difference',
    icon: 'search',
    question: 'What is AI-SEO and how does it differ from traditional SEO?',
    answer: 'AI-SEO (Artificial Intelligence Search Engine Optimization) is the practice of optimizing your website content specifically for AI-powered search engines and large language models like ChatGPT, Claude, and Gemini. Unlike traditional SEO that focuses on Google&apos;s algorithm, AI-SEO targets how these AI systems understand, process, and cite your content when users ask questions.',
    details: [
      'AI-SEO focuses on structured, question-answer format content that AI systems can easily extract and cite',
      'Traditional SEO prioritizes keyword density and backlinks, while AI-SEO emphasizes content clarity and authority signals',
      'AI-SEO requires understanding how large language models process and prioritize information differently than search engines'
    ],
    detailsType: 'ol'
  },
  {
    id: 'chatgpt-citations',
    icon: 'message-circle',
    question: 'How can I get my website cited by ChatGPT and other AI models?',
    answer: 'Getting cited by ChatGPT and other AI models requires a strategic approach to content optimization. The key is creating content that AI systems can easily understand, extract, and trust as authoritative sources.',
    details: [
      'Structure your content with clear headings, bullet points, and numbered lists that AI can easily parse',
      'Use structured data markup (JSON-LD) to help AI understand your content&apos;s context and purpose',
      'Create comprehensive, authoritative content that directly answers specific questions users might ask',
      'Include relevant statistics, case studies, and expert quotes to establish credibility',
      'Optimize for conversational queries and long-tail keywords that match how people ask AI systems questions'
    ],
    detailsType: 'ul'
  },
  {
    id: 'aeo-importance',
    icon: 'target',
    question: 'What is Answer Engine Optimization (AEO) and why is it important for my business?',
    answer: 'Answer Engine Optimization (AEO) is the practice of optimizing your content to appear in AI-generated answers from platforms like ChatGPT, Claude, Perplexity, and Google&apos;s AI Overviews. As more people turn to AI for information instead of traditional search engines, AEO becomes crucial for maintaining visibility and driving traffic to your website.',
    details: [
      'AEO helps your brand appear in AI-generated responses when users ask questions related to your industry',
      'It increases your brand&apos;s authority and visibility in the rapidly growing AI search ecosystem',
      'AEO can drive qualified traffic as users click through from AI responses to learn more',
      'It future-proofs your SEO strategy as AI becomes the primary way people search for information'
    ],
    detailsType: 'ul'
  },
  {
    id: 'clever-search-help',
    icon: 'zap',
    question: 'How does Cleversearch help optimize my content for large language models?',
    answer: 'Cleversearch uses advanced AI analysis to evaluate your website content from the perspective of large language models like ChatGPT, Claude, and Gemini. Our platform identifies specific areas where your content can be improved to increase citation probability and visibility in AI-generated responses.',
    details: [
      'Our AI analyzes your content structure, clarity, and authority signals that LLMs look for when selecting sources',
      'We provide specific recommendations for improving content formatting, adding structured data, and enhancing readability',
      'Our platform can automatically inject optimized content like FAQs, structured data, and enhanced metadata directly onto your pages',
      'We track your LLM-readiness score and monitor citation improvements over time to measure success'
    ],
    detailsType: 'ol'
  },
  {
    id: 'content-types-cited',
    icon: 'file-text',
    question: 'What types of content are most likely to be cited by AI models like ChatGPT and Claude?',
    answer: 'AI models like ChatGPT and Claude are most likely to cite content that is well-structured, authoritative, and directly answers specific questions. They prefer content that is easy to extract and summarize for their responses.',
    details: [
      'Comprehensive FAQ sections that directly answer common questions in your industry',
      'How-to guides and step-by-step tutorials that provide actionable information',
      'Data-driven content with statistics, research findings, and expert insights',
      'Comparison articles and product reviews that help users make informed decisions',
      'Industry reports and thought leadership content that establishes authority'
    ],
    detailsType: 'ul'
  },
  {
    id: 'results-timeline',
    icon: 'clock',
    question: 'How long does it take to see results from AI-SEO optimization?',
    answer: 'The timeline for seeing AI-SEO results varies depending on several factors, including your current content quality, the competitiveness of your industry, and how quickly you implement our recommendations. Generally, you can expect to see initial improvements within 2-4 weeks of implementing our suggestions.',
    details: [
      'Immediate improvements (1-2 weeks): Better content structure and readability scores',
      'Short-term results (2-4 weeks): Increased visibility in AI-generated responses and improved citation rates',
      'Long-term benefits (1-3 months): Sustained traffic growth and established authority in your industry'
    ],
    detailsType: 'ol'
  },
  {
    id: 'traditional-seo-compatibility',
    icon: 'layers',
    question: 'Can AI-SEO work alongside traditional SEO strategies?',
    answer: 'Absolutely! AI-SEO and traditional SEO are complementary strategies that work together to maximize your online visibility. While traditional SEO focuses on ranking in search engines like Google, AI-SEO optimizes for the growing number of AI-powered search platforms and conversational interfaces.',
    details: [
      'Many AI-SEO best practices also improve traditional SEO performance (better content structure, faster loading times)',
      'Traditional SEO elements like backlinks and domain authority still influence AI model decisions',
      'Combining both strategies creates a comprehensive approach that covers all search touchpoints',
      'AI-SEO can help you capture traffic from users who prefer AI-powered search over traditional search engines'
    ],
    detailsType: 'ul'
  },
  {
    id: 'llmo-vs-aeo',
    icon: 'cpu',
    question: 'What is the difference between LLMO (Large Language Model Optimization) and AEO (Answer Engine Optimization)?',
    answer: 'LLMO and AEO are related but distinct approaches to AI optimization. LLMO focuses specifically on optimizing content for large language models like ChatGPT, Claude, and Gemini, while AEO targets answer engines that provide direct responses to user queries.',
    details: [
      'LLMO emphasizes content structure, clarity, and authority signals that LLMs look for when selecting sources',
      'AEO focuses on appearing in direct answer features and AI-generated responses across various platforms',
      'LLMO is more technical and focuses on how AI models process and understand content',
      'AEO is more strategic and focuses on user intent and question-answer optimization'
    ],
    detailsType: 'ol'
  },
  {
    id: 'measure-success',
    icon: 'bar-chart',
    question: 'How do I measure the success of my AI-SEO efforts?',
    answer: 'Measuring AI-SEO success requires tracking both traditional metrics and AI-specific indicators. Our platform provides comprehensive analytics to help you understand how your content is performing in AI-powered search environments.',
    details: [
      'Track your LLM-readiness score and monitor improvements over time',
      'Monitor traffic from AI-powered platforms and conversational search',
      'Track citation mentions in AI-generated responses and summaries',
      'Measure engagement metrics for content optimized for AI consumption',
      'Monitor brand mentions and authority signals in AI-generated content'
    ],
    detailsType: 'ul'
  },
  {
    id: 'implementation-support',
    icon: 'headphones',
    question: 'Do you offer support for implementing AI-SEO recommendations?',
    answer: 'Yes! Our team provides comprehensive support to help you implement AI-SEO recommendations effectively. We understand that optimizing for AI models can be complex, so we offer guidance every step of the way.',
    details: [
      'Our platform provides step-by-step implementation guides for each recommendation',
      'We offer content injection tools that automatically implement many optimizations',
      'Our support team is available to answer questions and provide guidance on complex implementations',
      'We provide regular check-ins and progress reviews to ensure you&apos;re on track'
    ],
    detailsType: 'ol'
  }
]; 