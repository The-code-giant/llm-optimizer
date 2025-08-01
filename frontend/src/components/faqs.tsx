export default function FAQs() {
    return (
        <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-y-12 px-2 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-0">
                    {/* Left Side - Sticky Title */}
                    <div className="lg:sticky lg:top-8 lg:self-start lg:z-20">
                        <div className="text-center lg:text-left">
                            <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                                Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
                                Questions
                            </h2>
                            <p>Everything you need to know about AI-SEO optimization and getting cited by ChatGPT, Claude, and Gemini.</p>
                        </div>
                    </div>
                    
                    {/* Right Side - FAQ Content */}
                    <div className="lg:overflow-visible">

                    <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
                        <div className="pb-6">
                            <h3 className="font-medium">What is AI-SEO and how does it differ from traditional SEO?</h3>
                            <p className="text-muted-foreground mt-4">AI-SEO (Artificial Intelligence Search Engine Optimization) is the practice of optimizing your website content specifically for AI-powered search engines and large language models like ChatGPT, Claude, and Gemini. Unlike traditional SEO that focuses on Google&apos;s algorithm, AI-SEO targets how these AI systems understand, process, and cite your content when users ask questions.</p>
                            
                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">AI-SEO focuses on structured, question-answer format content that AI systems can easily extract and cite</li>
                                <li className="text-muted-foreground mt-4">Traditional SEO prioritizes keyword density and backlinks, while AI-SEO emphasizes content clarity and authority signals</li>
                                <li className="text-muted-foreground mt-4">AI-SEO requires understanding how large language models process and prioritize information differently than search engines</li>
                            </ol>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">How can I get my website cited by ChatGPT and other AI models?</h3>
                            <p className="text-muted-foreground mt-4">Getting cited by ChatGPT and other AI models requires a strategic approach to content optimization. The key is creating content that AI systems can easily understand, extract, and trust as authoritative sources.</p>
                            
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">Structure your content with clear headings, bullet points, and numbered lists that AI can easily parse</li>
                                <li className="text-muted-foreground">Use structured data markup (JSON-LD) to help AI understand your content&apos;s context and purpose</li>
                                <li className="text-muted-foreground">Create comprehensive, authoritative content that directly answers specific questions users might ask</li>
                                <li className="text-muted-foreground">Include relevant statistics, case studies, and expert quotes to establish credibility</li>
                                <li className="text-muted-foreground">Optimize for conversational queries and long-tail keywords that match how people ask AI systems questions</li>
                            </ul>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">What is Answer Engine Optimization (AEO) and why is it important for my business?</h3>
                            <p className="text-muted-foreground my-4">Answer Engine Optimization (AEO) is the practice of optimizing your content to appear in AI-generated answers from platforms like ChatGPT, Claude, Perplexity, and Google&apos;s AI Overviews. As more people turn to AI for information instead of traditional search engines, AEO becomes crucial for maintaining visibility and driving traffic to your website.</p>
                            
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">AEO helps your brand appear in AI-generated responses when users ask questions related to your industry</li>
                                <li className="text-muted-foreground">It increases your brand&apos;s authority and visibility in the rapidly growing AI search ecosystem</li>
                                <li className="text-muted-foreground">AEO can drive qualified traffic as users click through from AI responses to learn more</li>
                                <li className="text-muted-foreground">It future-proofs your SEO strategy as AI becomes the primary way people search for information</li>
                            </ul>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">How does Clever Search help optimize my content for large language models?</h3>
                            <p className="text-muted-foreground mt-4">Clever Search uses advanced AI analysis to evaluate your website content from the perspective of large language models like ChatGPT, Claude, and Gemini. Our platform identifies specific areas where your content can be improved to increase citation probability and visibility in AI-generated responses.</p>
                            
                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">Our AI analyzes your content structure, clarity, and authority signals that LLMs look for when selecting sources</li>
                                <li className="text-muted-foreground mt-4">We provide specific recommendations for improving content formatting, adding structured data, and enhancing readability</li>
                                <li className="text-muted-foreground mt-4">Our platform can automatically inject optimized content like FAQs, structured data, and enhanced metadata directly onto your pages</li>
                                <li className="text-muted-foreground mt-4">We track your LLM-readiness score and monitor citation improvements over time to measure success</li>
                            </ol>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">What types of content are most likely to be cited by AI models like ChatGPT and Claude?</h3>
                            <p className="text-muted-foreground mt-4">AI models like ChatGPT and Claude are most likely to cite content that is well-structured, authoritative, and directly answers specific questions. They prefer content that is easy to extract and summarize for their responses.</p>
                            
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">Comprehensive FAQ sections that directly answer common questions in your industry</li>
                                <li className="text-muted-foreground">How-to guides and step-by-step tutorials that provide actionable information</li>
                                <li className="text-muted-foreground">Data-driven content with statistics, research findings, and expert insights</li>
                                <li className="text-muted-foreground">Comparison articles and product reviews that help users make informed decisions</li>
                                <li className="text-muted-foreground">Industry reports and thought leadership content that establishes authority</li>
                            </ul>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">How long does it take to see results from AI-SEO optimization?</h3>
                            <p className="text-muted-foreground mt-4">The timeline for seeing AI-SEO results varies depending on several factors, including your current content quality, the competitiveness of your industry, and how quickly you implement our recommendations. Generally, you can expect to see initial improvements within 2-4 weeks of implementing our suggestions.</p>
                            
                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">Immediate improvements (1-2 weeks): Better content structure and readability scores</li>
                                <li className="text-muted-foreground mt-4">Short-term results (2-4 weeks): Increased visibility in AI-generated responses and improved citation rates</li>
                                <li className="text-muted-foreground mt-4">Long-term benefits (1-3 months): Sustained traffic growth and established authority in your industry</li>
                            </ol>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">Can AI-SEO work alongside traditional SEO strategies?</h3>
                            <p className="text-muted-foreground mt-4">Absolutely! AI-SEO and traditional SEO are complementary strategies that work together to maximize your online visibility. While traditional SEO focuses on ranking in search engines like Google, AI-SEO optimizes for the growing number of AI-powered search platforms and conversational interfaces.</p>
                            
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">Many AI-SEO best practices also improve traditional SEO performance (better content structure, faster loading times)</li>
                                <li className="text-muted-foreground">Traditional SEO elements like backlinks and domain authority still influence AI model decisions</li>
                                <li className="text-muted-foreground">Combining both strategies creates a comprehensive approach that covers all search touchpoints</li>
                                <li className="text-muted-foreground">AI-SEO can help you capture traffic from users who prefer AI-powered search over traditional search engines</li>
                            </ul>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">What is the difference between LLMO (Large Language Model Optimization) and AEO (Answer Engine Optimization)?</h3>
                            <p className="text-muted-foreground mt-4">LLMO and AEO are related but distinct approaches to AI optimization. LLMO focuses specifically on optimizing content for large language models like ChatGPT, Claude, and Gemini, while AEO targets answer engines that provide direct responses to user queries.</p>
                            
                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">LLMO emphasizes content structure, clarity, and authority signals that LLMs look for when selecting sources</li>
                                <li className="text-muted-foreground mt-4">AEO focuses on appearing in direct answer features and AI-generated responses across various platforms</li>
                                <li className="text-muted-foreground mt-4">LLMO is more technical and focuses on how AI models process and understand content</li>
                                <li className="text-muted-foreground mt-4">AEO is more strategic and focuses on user intent and question-answer optimization</li>
                            </ol>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">How do I measure the success of my AI-SEO efforts?</h3>
                            <p className="text-muted-foreground mt-4">Measuring AI-SEO success requires tracking both traditional metrics and AI-specific indicators. Our platform provides comprehensive analytics to help you understand how your content is performing in AI-powered search environments.</p>
                            
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">Track your LLM-readiness score and monitor improvements over time</li>
                                <li className="text-muted-foreground">Monitor traffic from AI-powered platforms and conversational search</li>
                                <li className="text-muted-foreground">Track citation mentions in AI-generated responses and summaries</li>
                                <li className="text-muted-foreground">Measure engagement metrics for content optimized for AI consumption</li>
                                <li className="text-muted-foreground">Monitor brand mentions and authority signals in AI-generated content</li>
                            </ul>
                        </div>
                        
                        <div className="py-6">
                            <h3 className="font-medium">Do you offer support for implementing AI-SEO recommendations?</h3>
                            <p className="text-muted-foreground mt-4">Yes! Our team provides comprehensive support to help you implement AI-SEO recommendations effectively. We understand that optimizing for AI models can be complex, so we offer guidance every step of the way.</p>
                            
                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">Our platform provides step-by-step implementation guides for each recommendation</li>
                                <li className="text-muted-foreground mt-4">We offer content injection tools that automatically implement many optimizations</li>
                                <li className="text-muted-foreground mt-4">Our support team is available to answer questions and provide guidance on complex implementations</li>
                                <li className="text-muted-foreground mt-4">We provide regular check-ins and progress reviews to ensure you&apos;re on track</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </section>
    )
}
