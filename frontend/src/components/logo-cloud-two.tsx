import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function LogoCloudTwo() {
    return (
        <section className="bg-background py-16">
            <div className="group relative m-auto max-w-5xl px-6">
                <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
                    <Link
                        href="/"
                        className="block text-sm duration-150 hover:opacity-75">
                        <span>Optimized for AI Platforms</span>

                        <ChevronRight className="ml-1 inline-block size-3" />
                    </Link>
                </div>
                <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/openai.svg"
                            alt="OpenAI Logo"
                            height="24"
                            width="auto"
                        />
                    </div>

                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/claude.svg"
                            alt="Claude Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/gemini.svg"
                            alt="Gemini Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/perplexity.svg"
                            alt="Perplexity Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/deepseek.svg"
                            alt="DeepSeek Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/grok.svg"
                            alt="Grok Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/metaai.svg"
                            alt="Meta AI Logo"
                            height="24"
                            width="auto"
                        />
                    </div>

                    <div className="flex">
                        <img
                            className="mx-auto h-6 w-fit dark:invert"
                            src="/ai-logos/openai.svg"
                            alt="OpenAI Logo"
                            height="24"
                            width="auto"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
