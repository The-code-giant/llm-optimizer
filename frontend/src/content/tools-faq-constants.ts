import { type FAQItem } from '@/content/faq-constants';

export const TOOLS_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-does-it-check',
    icon: 'search',
    question: 'What does the LLM & crawler checker actually test?',
    answer:
      'It checks robots.txt permissions, HTTP status responses, and basic reachability for Googlebot and leading AI crawlers like GPTBot, ClaudeBot, and Perplexity.',
    details: [
      'Verifies robots.txt allow/disallow for each bot',
      'Captures HTTP status codes to surface server errors',
      'Summarizes whether each crawler can reach the URL',
    ],
    detailsType: 'ul',
  },
  {
    id: 'how-to-fix-blockers',
    icon: 'shield',
    question: 'How do I fix blockers found by the tool?',
    answer:
      'Update your robots.txt rules and ensure your server returns 2xx responses for allowed crawlers. Our team can guide best practices for AI-SEO and AEO.',
    details: [
      'Allow important paths for AI crawlers in robots.txt',
      'Remove accidental disallows for key sections',
      'Resolve 4xx/5xx errors on critical pages',
    ],
    detailsType: 'ul',
  },
  {
    id: 'which-bots',
    icon: 'bot',
    question: 'Which crawlers are included?',
    answer:
      'The tool checks a set of popular search and AI crawlers, including Googlebot and AI agents like GPTBot, ClaudeBot, and Perplexity crawlers.',
    details: [
      'Coverage may evolve as platforms update their crawler policies',
      'Focuses on high-impact crawlers used by major AI systems',
    ],
    detailsType: 'ul',
  },
  {
    id: 'llm-visibility',
    icon: 'sparkles',
    question: 'How does this help with LLM visibility and citations?',
    answer:
      'Ensuring reachability is step one. Combined with FAQs and structured data, your content becomes easier for LLMs to parse and cite.',
    details: [
      'Add clear, question-based FAQs on key pages',
      'Use JSON-LD for FAQPage and WebPage metadata',
      'Write concise, authoritative answers aligned with user intent',
    ],
    detailsType: 'ul',
  },
];


