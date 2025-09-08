'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnimatedDiv from '@/components/ui/animated-div';
import LogoCloud from '@/components/logo-cloud';
import Link from 'next/link';
import Image from 'next/image';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Bot, ShieldCheck, Search, Lock } from 'lucide-react';
import { checkBotAccessibility, BotAccessResult, submitToolLead } from '@/lib/api';

export default function BotAccessToolClient() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    url: string;
    robotsTxtUrl: string;
    robotsTxtFound: boolean;
    results: BotAccessResult[];
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'checking' | 'lead' | 'done'>('checking');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [pendingResults, setPendingResults] = useState<{
    url: string;
    robotsTxtUrl: string;
    robotsTxtFound: boolean;
    results: BotAccessResult[];
  } | null>(null);
  const [progressBots, setProgressBots] = useState<string[]>([]);
  const [progressIndex, setProgressIndex] = useState(0);
  const websiteForLead = (pendingResults?.url || results?.url || url || '').trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    if (!url) {
      setError('Please enter a valid URL');
      return;
    }
    try {
      setLoading(true);
      setShowModal(true);
      setStep('checking');

      // Perform single API request
      const data = await checkBotAccessibility(url);
      setProgressBots(data.results.map((r) => r.agent));

      // Simulate per-bot progression
      const perBotDelay = 450;
      for (let i = 0; i < data.results.length; i++) {
        await new Promise((r) => setTimeout(r, perBotDelay));
        setProgressIndex(i + 1);
      }

      // Gate actual results until lead submitted
      setPendingResults(data);
      setStep('lead');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check bot accessibility';
      setError(message);
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    // Basic validations
    const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(leadEmail);
    if (!emailValid) {
      setLeadError('Please enter a valid email');
      return;
    }
    const derivedWebsite = (pendingResults?.url || results?.url || url || '').trim();
    if (!derivedWebsite) {
      setLeadError('Missing website URL');
      return;
    }
    try {
      await submitToolLead({ email: leadEmail, phone: leadPhone || undefined, website: derivedWebsite });
      if (pendingResults) setResults(pendingResults);
      setStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit lead';
      setLeadError(message);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[1100px] rounded-full bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 opacity-40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
          <AnimatedDiv initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-gray-600 bg-white/60 backdrop-blur">
                <SparklesIcon className="h-4 w-4 text-blue-600" /> Free tool by Cleversearch
              </span>
              <h1 className="mt-6 text-4xl font-normal text-gray-900 sm:text-5xl">
                LLM & Crawler Accessibility Checker
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                See if Googlebot and leading AI crawlers (GPTBot, ClaudeBot, Perplexity, and more) can reach your page.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
              <Input
                type="url"
                placeholder="https://yourdomain.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="h-12"
              />
              <Button type="submit" disabled={loading} className="h-12 px-6">
                {loading ? 'Checking…' : (
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" /> Run Check
                  </span>
                )}
              </Button>
            </form>
            {error && <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-red-600">{error}</p>}
          </AnimatedDiv>
        </div>
        <div className="relative z-10">
          <LogoCloud />
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          {results && (
            <AnimatedDiv initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Robots file: <a href={results.robotsTxtUrl} target="_blank" className="underline" rel="noreferrer">{results.robotsTxtUrl}</a>
                    {!results.robotsTxtFound && <span className="ml-2 text-amber-600">(robots.txt not found)</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="py-2 pr-4">Bot</th>
                          <th className="py-2 pr-4">robots.txt</th>
                          <th className="py-2 pr-4">HTTP</th>
                          <th className="py-2">Reachable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.map((r, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-4">{r.agent}</td>
                            <td className="py-2 pr-4 capitalize">
                              {r.robotsAllowed === 'unknown' ? 'unknown' : r.robotsAllowed ? 'allow' : 'disallow'}
                            </td>
                            <td className="py-2 pr-4">{r.httpStatus ?? '-'}</td>
                            <td className="py-2">
                              {r.ok ? (
                                <span className="text-green-600">Yes</span>
                              ) : (
                                <span className="text-red-600">No{r.error ? ` – ${r.error}` : ''}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDiv>
          )}

          {/* Benefits grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <AnimatedDiv initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Bot className="h-5 w-5 text-blue-700" />
                  </div>
                  <CardTitle>AI-ready visibility</CardTitle>
                  <CardDescription>Verify that AI crawlers can reach and read your content.</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <ShieldCheck className="h-5 w-5 text-green-700" />
                  </div>
                  <CardTitle>Robots & responses</CardTitle>
                  <CardDescription>Catch disallowed paths and server errors blocking discovery.</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedDiv>
            <AnimatedDiv initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Search className="h-5 w-5 text-purple-700" />
                  </div>
                  <CardTitle>Faster debugging</CardTitle>
                  <CardDescription>Pinpoint issues before they cost you AI and search visibility.</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedDiv>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-black p-8 text-white">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="text-sm text-gray-400 uppercase tracking-wider mb-2 block">CLEVERSEARCH</span>
                <h2 className="text-3xl sm:text-4xl font-normal leading-tight">Fix crawlability and get cited by leading AI systems.</h2>
                <p className="mt-3 text-gray-300">We’ll help you eliminate blockers and structure content for AI understanding.</p>
              </div>
              <div className="flex gap-3 md:justify-end">
                <Link href="/demo">
                  <Button className="bg-white text-black hover:bg-gray-100">Book a demo</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="g-white text-black hover:bg-gray-100">Start free</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal for progress + lead form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          {step === 'checking' && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/logo/clever-search-logo-black.png"
                      width={150}
                      height={36}
                      alt="Clever Search"
                      className="block dark:hidden"
                    />
                    <Image
                      src="/logo/clever-search-logo-white.png"
                      width={150}
                      height={36}
                      alt="Clever Search"
                      className="hidden dark:block"
                    />
                  </div>
                </div>
                <DialogTitle className="mt-2">Checking accessibility…</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">We’re testing your URL with popular search and AI crawlers.</p>
                {progressIndex > 0 && progressBots[progressIndex - 1] && (
                  <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    Currently checking: <span className="font-medium">{progressBots[progressIndex - 1]}</span>
                  </div>
                )}
                {progressBots.length > 0 ? (
                  <div className="space-y-2">
                    {progressBots.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 text-sm">
                        <div className={`h-2 w-2 rounded-full ${i < progressIndex ? 'bg-green-500' : 'bg-gray-300'} `} />
                        <span className={`${i < progressIndex ? 'text-gray-900' : 'text-gray-500'}`}>{name}</span>
                      </div>
                    ))}
                    <div className="h-1 w-full overflow-hidden rounded bg-gray-100">
                      <div className="h-1 rounded bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: `${Math.min(100, (progressIndex / Math.max(1, progressBots.length)) * 100)}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[1,2,3,4,5,6,7,8].map((_, i) => (
                      <div key={i} className="h-2 w-full overflow-hidden rounded bg-gray-100">
                        <div className="h-2 w-1/3 animate-pulse rounded bg-gradient-to-r from-blue-400 to-purple-500" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">This usually takes a few seconds.</p>
              </div>
            </div>
          )}
          {step === 'lead' && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/logo/clever-search-logo-black.png"
                      width={150}
                      height={36}
                      alt="Clever Search"
                      className="block dark:hidden"
                    />
                    <Image
                      src="/logo/clever-search-logo-white.png"
                      width={150}
                      height={36}
                      alt="Clever Search"
                      className="hidden dark:block"
                    />
                  </div>
                </div>
                <DialogTitle className="mt-2">Where can we send your results?</DialogTitle>
              </DialogHeader>
              <div className="mt-2 text-sm text-gray-600">
                {websiteForLead ? (
                  <span>For: <span className="font-medium">{websiteForLead}</span></span>
                ) : (
                  <span>Enter your details to view the report.</span>
                )}
              </div>
              <div className="mt-3 rounded-lg border bg-white p-3 text-sm text-gray-700">
                <div className="mb-2 font-medium">What you&apos;ll get</div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-green-600" /> Action list to fix robots/server blockers</li>
                  <li className="flex items-start gap-2"><Bot className="mt-0.5 h-4 w-4 text-blue-600" /> Guidance to allow modern AI crawlers (GPTBot, ClaudeBot, etc.)</li>
                  <li className="flex items-start gap-2"><Search className="mt-0.5 h-4 w-4 text-purple-600" /> Recommendations to improve AI and search visibility</li>
                </ul>
              </div>
              <form onSubmit={onSubmitLead} className="mt-4 space-y-3">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
                {leadError && <p className="text-sm text-red-600">{leadError}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span>No spam. Unsubscribe anytime.</span>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit">View results</Button>
                </div>
              </form>
            </div>
          )}
          {step === 'done' && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo/clever-search-logo-black.png"
                    width={150}
                    height={36}
                    alt="Clever Search"
                    className="block dark:hidden"
                  />
                  <Image
                    src="/logo/clever-search-logo-white.png"
                    width={150}
                    height={36}
                    alt="Clever Search"
                    className="hidden dark:block"
                  />
                </div>
                <DialogTitle className="mt-2">Thanks! Here are your results</DialogTitle>
              </DialogHeader>
              <div className="mt-3 text-sm text-gray-600">
                You can also book a quick call and we’ll help fix any blockers.
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <Link href="/demo"><Button>Book a demo</Button></Link>
                <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


