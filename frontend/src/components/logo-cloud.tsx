import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import Image from 'next/image'

// AI Platform logos constants
const AI_LOGOS = [
    {
        src: '/ai-logos/openai.svg',
        alt: 'OpenAI Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/claude.svg',
        alt: 'Claude Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/gemini.svg',
        alt: 'Gemini Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/perplexity.svg',
        alt: 'Perplexity Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/deepseek.svg',
        alt: 'DeepSeek Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/grok.svg',
        alt: 'Grok Logo',
        width: 50,
        height: 50
    },
    {
        src: '/ai-logos/metaai.svg',
        alt: 'Meta AI Logo',
        width: 50,
        height: 50
    }
]

export default function LogoCloud() {
    return (
        <section className="bg-background overflow-hidden py-16">
            <div className="group relative m-auto max-w-7xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-sm">Optimized for AI Platforms</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={112}>
                            {AI_LOGOS.map((logo, index) => (
                                <div key={index} className="flex">
                                    <Image
                                        className="mx-auto h-6 w-fit dark:invert"
                                        src={logo.src}
                                        alt={logo.alt}
                                        width={logo.width}
                                        height={logo.height}
                                        style={{
                                            height: '50px',
                                            width: 'auto'
                                        }}
                                    />
                                </div>
                            ))}
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
