"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, ArrowRight } from "lucide-react";

interface KeywordsOptimizationFormProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  onSkip: () => void;
  onContinue: () => void;
  recommendations?: string[];
}

export default function KeywordsOptimizationForm({
  keywords,
  onKeywordsChange,
  onSkip,
  onContinue,
  recommendations = []
}: KeywordsOptimizationFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Keyword Strategy</h3>
        <p className="text-sm text-muted-foreground">
          Define your primary keywords and search terms for better SEO targeting
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
            <CardTitle className="text-base">Primary Keywords</CardTitle>
            <CardDescription>
              Define the main keywords you want to rank for
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                value={keywords.join(', ')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onKeywordsChange(e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean))
                }
                placeholder="Enter keywords separated by commas..."
              />
              <p className="text-xs text-muted-foreground">
                Focus on 3-5 primary keywords that best describe your content
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

