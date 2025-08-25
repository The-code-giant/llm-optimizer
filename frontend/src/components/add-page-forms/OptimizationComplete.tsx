"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ExternalLink, ArrowRight } from "lucide-react";

interface PageContent {
  title: string;
  description: string;
  keywords: string[];
  faqs: string[];
}

interface OptimizationCompleteProps {
  pageContent: PageContent;
  onSkip: () => void;
  onContinue: () => void;
}

export default function OptimizationComplete({ 
  pageContent, 
  onSkip, 
  onContinue 
}: OptimizationCompleteProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Optimization Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your page has been optimized. Here&apos;s a summary of what we&apos;ve prepared.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Optimized Content Summary</CardTitle>
            <CardDescription>
              Review the content we&apos;ve prepared for your page
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Page Title</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {pageContent.title || "No title set"}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Meta Description</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {pageContent.description || "No description set"}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Target Keywords</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {pageContent.keywords.length > 0 
                    ? pageContent.keywords.join(', ') 
                    : "No keywords set"
                  }
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">FAQ Questions</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {pageContent.faqs.length > 0 
                    ? pageContent.faqs.join('\n') 
                    : "No FAQ questions set"
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Review and edit the optimized content</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Deploy content to your page</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Monitor performance improvements</span>
              </div>
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
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to Page
        </Button>
        <Button 
          onClick={onContinue}
          className="flex-1"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}

