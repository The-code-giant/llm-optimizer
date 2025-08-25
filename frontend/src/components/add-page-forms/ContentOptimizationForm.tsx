"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, ArrowRight } from "lucide-react";

interface ContentOptimizationFormProps {
  faqs: string[];
  onFaqsChange: (faqs: string[]) => void;
  onSkip: () => void;
  onContinue: () => void;
  recommendations?: string[];
}

export default function ContentOptimizationForm({
  faqs,
  onFaqsChange,
  onSkip,
  onContinue,
  recommendations = []
}: ContentOptimizationFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <PenTool className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Content Structure</h3>
        <p className="text-sm text-muted-foreground">
          Improve your content structure and readability for better user engagement
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Content Planning</CardTitle>
            <CardDescription>
              Plan your content structure and FAQ sections
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faqs">FAQ Questions (Optional)</Label>
              <Input
                id="faqs"
                value={faqs.join('\n')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onFaqsChange(e.target.value.split('\n').filter((faq: string) => faq.trim()))
                }
                placeholder="Enter FAQ questions, one per line..."
              />
              <p className="text-xs text-muted-foreground">
                Add common questions your users might have about this topic
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onSkip}
          className="flex-1"
        >
          Skip & Go to Page
        </Button>
        <Button 
          onClick={onContinue}
          className="flex-1"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

