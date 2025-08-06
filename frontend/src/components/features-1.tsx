import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Search, Target, Bot } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-7xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Built to cover your needs</h2>
                    <p className="mt-4">Optimize your content for AI-powered search and boost your visibility across all major LLM platforms.</p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Search
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Evaluate Your LLM Score</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Find out how your site performs in AI-powered search. We scan your content the way large language models see it—and show you what they're missing.</p>
                            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                                <li>• Get a simple LLM visibility score out of 100</li>
                                <li>• Understand how AI sees your pages, not just Google</li>
                                <li>• Instant analysis—no setup required</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Target
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Personalized Optimization Tasks</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">We turn your LLM score into easy, actionable tasks that will boost your AI visibility and conversions.</p>
                            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                                <li>• Personalized recommendations based on your content</li>
                                <li>• Task list auto-updates as you improve and add more content</li>
                                <li>• One-click schema and copy injections without touching your code base</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Bot
                                    className="size-6"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Detect AI Traffic</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">See every time an AI assistant lands on your site. Our server logs spot ChatGPT, Perplexity, Gemini, etc., in real time.</p>
                            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                                <li>• Real-time AI crawler detection across 25+ platforms</li>
                                <li>• Server-side logging captures all AI bot visits</li>
                                <li>• Zero false positives with smart pattern matching</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
        />
        <div
            aria-hidden
            className="bg-radial to-background absolute inset-0 from-transparent to-75%"
        />
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
)
