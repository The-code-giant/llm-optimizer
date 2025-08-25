"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface DescriptionOptimizationFormProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  descriptionSuggestions: string[];
  generatingDescription: boolean;
  onGenerateSuggestions: () => void;
  onSkip: () => void;
  onContinue: () => void;
  recommendations?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export default function DescriptionOptimizationForm({
  description,
  onDescriptionChange,
  descriptionSuggestions,
  generatingDescription,
  onGenerateSuggestions,
  onSkip,
  onContinue,
  recommendations = [],
  onSuggestionSelect
}: DescriptionOptimizationFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Meta Description</h3>
        <p className="text-sm text-muted-foreground">
          Create compelling meta descriptions that drive clicks from search results
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
            <CardTitle className="text-base">Edit Meta Description</CardTitle>
            <CardDescription>
              Keep your description between 150-160 characters for optimal display in search results
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onDescriptionChange(e.target.value)}
                placeholder="Enter a compelling meta description..."
                maxLength={160}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>SEO best practice: 150-160 characters</span>
                <span>{description.length}/160</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onGenerateSuggestions} 
                disabled={generatingDescription}
                className="flex-1"
              >
                {generatingDescription ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate AI Suggestions
              </Button>
            </div>

            {descriptionSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">AI Suggestions</div>
                {descriptionSuggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground break-words flex-1">
                        {suggestion}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {suggestion.length} chars
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            onDescriptionChange(suggestion);
                            onSuggestionSelect?.(suggestion);
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
