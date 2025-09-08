import { Metadata } from 'next';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import FAQsThree from '@/components/faqs-3';
import BotAccessToolClient from '@/components/tools/BotAccessToolClient';
import { TOOLS_FAQ_ITEMS } from '@/content/tools-faq-constants';
import { type FAQItem } from '@/content/faq-constants';
import { generatePageMetadata } from '@/lib/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'LLM & Crawler Accessibility Checker | Cleversearch Tools',
  description:
    'Free tool to check if Googlebot and AI crawlers (GPTBot, ClaudeBot, Perplexity, and more) can access your page. Identify robots.txt and HTTP blockers, and get AI-SEO guidance.',
  tags: [
    'LLM crawler checker',
    'AI crawler accessibility',
    'robots.txt checker',
    'GPTBot access',
    'ClaudeBot access',
    'Perplexity crawler',
    'AI-SEO tools',
    'Answer Engine Optimization',
  ],
  slug: 'tools',
  type: 'website',
});

export default function BotAccessToolPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <BotAccessToolClient />

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <FAQsThree
            title="FAQ: LLM & Crawler Accessibility Checker"
            subtitle="Have more questions? Contact our"
            supportLink="/contact"
            supportText="support team"
            items={TOOLS_FAQ_ITEMS}
          />
        </div>
      </section>


      <Footer />

      {/* FAQ Schema (AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: TOOLS_FAQ_ITEMS.map((faq: FAQItem) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "LLM & Crawler Accessibility Checker",
            url: "https://cleversearch.ai/tools",
            description:
              "Free tool to check if Googlebot and AI crawlers (GPTBot, ClaudeBot, Perplexity, and more) can access your page.",
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://cleversearch.ai" },
                { "@type": "ListItem", position: 2, name: "Tools", item: "https://cleversearch.ai/tools" },
              ],
            },
          }),
        }}
      />
    </div>
  );
}


