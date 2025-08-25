import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Check, ArrowRight, Sparkles, Shield, Globe, Zap, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Clever Search",
  description:
    "Transparent pricing for Clever Search. Choose Starter or Pro to optimize your site for Answer Engines (AEO) and local GEO presence. Enterprise? Contact us for a tailored plan.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Clever Search Pricing",
    description:
      "Plans designed for AEO and GEO optimization. Get started with Starter, grow with Pro, or contact us for Enterprise.",
    url: "/pricing",
    type: "website",
  },
};

const features = [
  "AI-driven analysis and recommendations",
  "AEO-first content guidance (titles, descriptions, FAQs)",
  "GEO-ready setup for locations and services",
  "LLM readiness score and improvements",
  "Content deployment with safe rollback",
  "Tracker and analytics for injected content",
];

const plans = [
  {
    name: "Starter",
    tagline: "Perfect for small sites getting started with AEO",
    price: "$19",
    period: "/mo",
    cta: { label: "Start Free Trial", href: "/demo" },
    highlight: false,
    includes: [
      "1 website",
      "Up to 10,000 monthly page views",
      "Up to 500 pages scanned",
      "Title & Meta Description suggestions",
      "Basic FAQ generator",
      "Content deployment (manual)",
      "Basic traffic analytics",
      "Email support",
    ],
  },
  {
    name: "Pro",
    tagline: "Scale AEO + GEO across growing sites",
    price: "$79",
    period: "/mo",
    cta: { label: "Upgrade to Pro", href: "/demo" },
    highlight: true,
    includes: [
      "Up to 5 websites",
      "Up to 100,000 monthly page views",
      "Up to 10,000 pages scanned",
      "Advanced FAQ + Paragraph generation",
      "Keyword analysis (primary, long-tail, semantic)",
      "One-click deploy & versioning",
      "Advanced traffic analytics & AEO metrics",
      "Real-time performance monitoring",
      "Priority support + onboarding call",
    ],
  },
  {
    name: "Enterprise",
    tagline: "Custom needs, SSO, SLAs, and advanced governance",
    price: "Custom",
    period: "",
    cta: { label: "Contact Us", href: "/contact" },
    highlight: false,
    includes: [
      "Unlimited websites and pages",
      "Unlimited monthly page views",
      "Custom LLM workflows and integrations",
      "Role-based access control and audit logs",
      "Custom trackers & private data connectors",
      "Traffic forecasting & predictive analytics",
      "Advanced A/B testing & optimization",
      "Dedicated success manager & SLAs",
      "Security reviews and procurement support",
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
              Pricing designed for
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500"> AEO</span>
              {" "}and local GEO success
            </h1>
            <p className="mt-6 text-gray-600 text-lg max-w-2xl mx-auto">
              Choose a plan that fits your growth. Each plan includes AI-powered analysis, Answer Engine Optimization guidance, and local-ready content tools.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {plan.name === "Enterprise" ? (
                      <Button asChild className="w-full">
                        <Link href={plan.cta.href}>{plan.cta.label} <ArrowRight className="h-4 w-4 ml-2" /></Link>
                      </Button>
                    ) : (
                      <Button asChild variant={plan.highlight ? "default" : "outline"} className="w-full">
                        <Link href={plan.cta.href}>{plan.cta.label} <ArrowRight className="h-4 w-4 ml-2" /></Link>
                      </Button>
                    )}
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
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Human + AI</CardTitle>
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
            Start free with Starter or scale with Pro. Enterprise teams can contact sales for a tailored plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Get started free
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Contact sales
              </Button>
            </Link>
          </div>
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
            mainEntity: [
              {
                "@type": "Question",
                name: "Which plan is best for AEO?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Pro is ideal if you’re managing multiple locations or services and want advanced AI content generation and analytics.",
                },
              },
              {
                "@type": "Question",
                name: "Can I upgrade later?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, you can upgrade from Starter to Pro at any time and keep your data and settings.",
                },
              },
              {
                "@type": "Question",
                name: "How does Enterprise work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Enterprise is custom-tailored with SSO, SLAs, and governance. Contact us through the form and our team will reach out.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
