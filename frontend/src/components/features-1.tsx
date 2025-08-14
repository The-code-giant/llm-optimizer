import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Search, Target, Bot } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-7xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Search Engine Optimization for AI</h2>
                    <p className="mt-6 text-lg text-muted-foreground">Optimize your content structure and metadata to reach new customers who are using AI for search.</p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-12 grid max-w-sm gap-8 *:text-center md:mt-20">
                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-4">
                            <CardDecorator>
                                <Search
                                    className="size-7"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 text-xl font-semibold">Evaluate Your LLM Score</h3>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-base leading-relaxed">Find out how your site performs in AI-powered search. We scan your content the way large language models see it—and show you what they're missing.</p>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Get a simple LLM visibility score out of 100</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Understand how AI sees your pages, not just Google</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Instant analysis—no setup required</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-4">
                            <CardDecorator>
                                <Target
                                    className="size-7"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 text-xl font-semibold">Personalized Optimization Tasks</h3>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-base leading-relaxed">We turn your LLM score into easy, actionable tasks that will boost your AI visibility and conversions.</p>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Personalized recommendations based on your content</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Task list auto-updates as you improve and add more content</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>One-click schema and copy injections without touching your code base</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-4">
                            <CardDecorator>
                                <Bot
                                    className="size-7"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 text-xl font-semibold">Detect AI Traffic</h3>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-base leading-relaxed">See every time an AI assistant lands on your site. Our server logs spot ChatGPT, Perplexity, Gemini, etc., in real time.</p>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Real-time AI crawler detection across 25+ platforms</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Server-side logging captures all AI bot visits</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                                    <span>Zero false positives with smart pattern matching</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-40 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
        />
        <div
            aria-hidden
            className="bg-radial to-background absolute inset-0 from-transparent to-75%"
        />
        <div className="bg-background absolute inset-0 m-auto flex size-14 items-center justify-center border-l border-t">{children}</div>
    </div>
)
