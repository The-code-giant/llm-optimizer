'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DynamicIcon } from 'lucide-react/dynamic'
import Link from 'next/link'
import { FAQ_ITEMS, type FAQItem } from '../content/faq-constants'

interface FAQsThreeProps {
    title?: string;
    subtitle?: string;
    supportLink?: string;
    supportText?: string;
    items?: FAQItem[];
}

export default function FAQsThree({
    title = "Frequently Asked Questions",
    subtitle = "Can’t find what you’re looking for? Contact our",
    supportLink = "/demo",
    supportText = "customer support team",
    items = FAQ_ITEMS
}: FAQsThreeProps) {

    return (
        <section className="bg-muted dark:bg-background py-20">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="flex flex-col gap-10 md:flex-row md:gap-16">
                    <div className="md:w-1/3">
                        <div className="sticky top-20">
                            <h2 className="mt-4 text-3xl font-bold">{title}</h2>
                            <p className="text-muted-foreground mt-4">
                                {subtitle}{' '}
                                <Link
                                    href={supportLink}
                                    className="text-primary font-medium hover:underline">
                                    {supportText}
                                </Link>
                            </p>
                        </div>
                    </div>
                    <div className="md:w-2/3">
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-2">
                            {items.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={item.id}
                                    className="bg-background shadow-xs rounded-lg border px-4 last:border-b">
                                    <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-6">
                                                <DynamicIcon
                                                    name={item.icon}
                                                    className="m-auto size-4"
                                                />
                                            </div>
                                            <span className="text-base">{item.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-5">
                                        <div className="px-9">
                                            <p className="text-base">{item.answer}</p>
                                            {item.details && item.details.length > 0 && (
                                                <div className="mt-4">
                                                    {item.detailsType === 'ol' ? (
                                                        <ol className="list-outside list-decimal space-y-2 pl-4">
                                                            {item.details.map((detail: string, index: number) => (
                                                                <li key={index} className="text-muted-foreground mt-4">
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <ul className="list-outside list-disc space-y-2 pl-4">
                                                            {item.details.map((detail: string, index: number) => (
                                                                <li key={index} className="text-muted-foreground">
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
} 