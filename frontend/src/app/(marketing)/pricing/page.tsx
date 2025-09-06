import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Check, ArrowRight, Sparkles, Shield, Globe, Zap } from "lucide-react";
import FAQsThree from "@/components/faqs-3";
import { PRICING_FAQ_ITEMS } from "@/content/pricing-faq-constants";

export const metadata: Metadata = {
  title: "Pricing | Cleversearch - AI-SEO & Answer Engine Optimization Plans",
  description:
    "Pricing built for the future of search! Pick the plan that matches your ambition. Every tier comes with AI-driven insights, Answer Engine Optimization guidance, and local-first content tools designed to put you ahead in AI search. Pro plan starts at $79/month with 7-day free trial. Enterprise custom pricing available.",
  keywords: [
    "AI-SEO pricing",
    "Answer Engine Optimization cost",
    "LLM optimization pricing",
    "ChatGPT optimization plans",
    "AI search optimization pricing",
    "Cleversearch pricing",
    "AEO pricing plans",
    "AI content optimization cost"
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Cleversearch Pricing - AI-SEO & Answer Engine Optimization Plans",
    description:
      "Pricing built for the future of search! Pick the plan that matches your ambition. Every tier comes with AI-driven insights, Answer Engine Optimization guidance, and local-first content tools designed to put you ahead in AI search.",
    url: "/pricing",
    type: "website",
    images: [
      {
        url: "/og-pricing.png",
        width: 1200,
        height: 630,
        alt: "Cleversearch Pricing Plans - AI-SEO & Answer Engine Optimization",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cleversearch Pricing - AI-SEO & Answer Engine Optimization Plans",
    description:
      "Pricing built for the future of search! Pick the plan that matches your ambition. Every tier comes with AI-driven insights, Answer Engine Optimization guidance, and local-first content tools designed to put you ahead in AI search.",
    images: ["/og-pricing.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const plans = [
  {
    name: "Pro",
    tagline: "Perfect for growing websites and businesses",
    price: "$79",
    period: "/mo",
    cta: { label: "Start 7-Day Free Trial", href: "/register" },
    highlight: true,
    includes: [
      "Up to 2 sites",
      "5,000 pages per month",
      "Up to 100,000 monthly page views",
      "1 seat",
      "Advanced LLM optimization",
      "Advanced traffic analytics & GEO metrics",
      "Real-time performance monitoring",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For large websites, agencies, and enterprises",
    price: "Custom",
    period: "pricing",
    cta: { label: "Contact Sales", href: "/contact" },
    highlight: false,
    includes: [
      "Unlimited sites & pages",
      "Dedicated Customer Success Manager",
      "Custom AI Models & Fine-Tuning",
      "Multi-Geo Intelligence",
      "Team Management & Roles",
      "White-Glove Onboarding & Migration",
      "Early Access to Beta Features",
      "Custom Reporting & Strategy Sessions",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Badge className="mb-3 bg-primary/15 text-primary">Simple, transparent pricing</Badge>
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight">
              Pricing built for the future of search!
            </h1>
            <p className="mt-6 text-gray-600 text-lg max-w-3xl mx-auto">
              Pick the plan that matches your ambition. Every tier comes with AI-driven insights, Answer Engine Optimization guidance, and local-first content tools designed to put you ahead in AI search.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4"/> AEO-first</div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4"/> GEO-ready</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4"/> Secure & private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`${plan.highlight ? "border-primary shadow-lg" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">{plan.tagline}</CardDescription>
                    </div>
                    {plan.highlight && (
                      <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                      <Link href={plan.cta.href}>
                        {plan.cta.label} <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/> AEO Guidance</CardTitle>
                <CardDescription>Everything is built for Answer Engines — titles, descriptions, FAQs, and paragraph generation are tuned for LLM citation.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/> GEO-Ready</CardTitle>
                <CardDescription>Location pages and services are structured to win local visibility and improve conversions in target regions.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/> AI-Powered</CardTitle>
                <CardDescription>Keep creative control while our AI does the heavy lifting. Review, edit, and deploy with one click.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
            Ready to optimize for Answer Engines?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Start with our 7-day free trial or scale with Pro. Enterprise teams can contact sales for a tailored plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
              <Link href="/register">Get started free</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
              <Link href="/contact">Contact sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <FAQsThree
            title="Pricing Questions"
            subtitle="Still have questions about our pricing? Contact our"
            supportLink="/contact"
            supportText="sales team"
            items={PRICING_FAQ_ITEMS}
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* FAQ Schema (AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: PRICING_FAQ_ITEMS.map(faq => ({
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

      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Cleversearch AI-SEO Platform",
            description: "AI-powered search engine optimization platform for Answer Engine Optimization (AEO) and Large Language Model Optimization (LLMO)",
            brand: {
              "@type": "Brand",
              name: "Cleversearch"
            },
            offers: [
              {
                "@type": "Offer",
                name: "Pro Plan",
                price: "79",
                priceCurrency: "USD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "79",
                  priceCurrency: "USD",
                  billingIncrement: "P1M"
                },
                description: "Perfect for growing websites and businesses with up to 2 sites, 5,000 pages per month, and advanced LLM optimization",
                availability: "https://schema.org/InStock",
                validFrom: "2024-01-01"
              },
              {
                "@type": "Offer",
                name: "Enterprise Plan",
                price: "0",
                priceCurrency: "USD",
                description: "Custom pricing for large websites, agencies, and enterprises with unlimited sites, dedicated support, and custom AI models",
                availability: "https://schema.org/InStock",
                validFrom: "2024-01-01"
              }
            ],
            category: "Software",
            applicationCategory: "BusinessApplication"
          }),
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cleversearch",
            description: "Leading AI-SEO platform specializing in Answer Engine Optimization (AEO) and Large Language Model Optimization (LLMO)",
            url: "https://cleversearch.ai",
            logo: "https://cleversearch.ai/logo/clever-search-logo-black.png",
            sameAs: [
              "https://twitter.com/cleversearch",
              "https://linkedin.com/company/cleversearch"
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              url: "https://cleversearch.ai/contact",
              availableLanguage: "English"
            },
            areaServed: "Worldwide",
            serviceType: "AI-SEO and Answer Engine Optimization"
          }),
        }}
      />
    </div>
  );
}
