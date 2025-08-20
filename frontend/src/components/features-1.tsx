import { cn } from "@/lib/utils";
import {
  IconChartBar,
  IconCheck,
  IconClipboardList,
  IconRadar,
} from "@tabler/icons-react";

export default function Features() {
  const features = [
    {
      title: "Evaluate Your LLM Score",
      description:
        "Find out how your site performs in AI-powered search. We scan your content the way large language models see it—and show you what they're missing.",
      icon: <IconChartBar />,
      bulletPoints: [
        "Get a simple LLM visibility score out of 100",
        "Understand how AI sees your pages, not just Google",
        "Instant analysis—no setup required",
      ],
    },
    {
      title: "Personalized Optimization Tasks",
      description:
        "We turn your LLM score into easy, actionable tasks that will boost your AI visibility and conversions.",
      icon: <IconClipboardList />,
      bulletPoints: [
        "Personalized recommendations based on your content",
        "Task list auto-updates as you improve and add more content",
        "One-click schema and copy injections without touching your code base",
      ],
    },
    {
      title: "Detect AI Traffic",
      description:
        "See every time an AI assistant lands on your site. Our server logs spot ChatGPT, Perplexity, Gemini, etc., in real time.",
      icon: <IconRadar />,
      bulletPoints: [
        "Real-time AI crawler detection across 25+ platforms",
        "Server-side logging captures all AI bot visits",
        "Zero false positives with smart pattern matching",
      ],
    },
  ];

  return (
    <section
      id="features"
      className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent"
    >
      <div className="@container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
            Search Engine Optimization for AI
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12">
            Optimize your content structure and metadata to reach new customers
            who are using AI for search.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <SingleFeature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const SingleFeature = ({
  title,
  description,
  icon,
  index,
  bulletPoints,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  bulletPoints?: string[];
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        index === 0 && "lg:border-l dark:border-neutral-800"
      )}
    >
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-[#30B4CA] transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>

      {bulletPoints && (
        <div className="mt-4 relative z-10 px-10">
          <ul className="space-y-3">
            {bulletPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#30B4CA] flex items-center justify-center mt-0.5">
                  <IconCheck className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
