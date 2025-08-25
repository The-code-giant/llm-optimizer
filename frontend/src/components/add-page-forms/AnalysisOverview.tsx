"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface AnalysisResult {
  id: string;
  pageId: string;
  summary: string;
  issues: string[];
  recommendations: string[];
  createdAt: string;
  contentQuality?: {
    clarity: number;
    structure: number;
    completeness: number;
  };
  technicalSEO?: {
    headingStructure: number;
    semanticMarkup: number;
    contentDepth: number;
    titleOptimization: number;
    metaDescription: number;
    schemaMarkup: number;
  };
  keywordAnalysis?: {
    primaryKeywords: string[];
    longTailKeywords: string[];
    keywordDensity: number;
    semanticKeywords: string[];
    missingKeywords: string[];
  };
  llmOptimization?: {
    definitionsPresent: boolean;
    faqsPresent: boolean;
    structuredData: boolean;
    citationFriendly: boolean;
    topicCoverage: number;
    answerableQuestions: number;
  };
}

interface AnalysisOverviewProps {
  analysis: AnalysisResult | null;
  onSkip: () => void;
  onContinue: () => void;
}

export default function AnalysisOverview({ analysis, onSkip, onContinue }: AnalysisOverviewProps) {
  if (!analysis) return null;

  const summary = JSON.parse(analysis?.summary || '{}');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Page Analysis Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your page has been analyzed. Here&apos;s what we found and how to optimize it.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{summary.summary}</p>
          </CardContent>
        </Card>

        {analysis.contentQuality && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content Quality</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.contentQuality.clarity}</div>
                  <div className="text-sm text-muted-foreground">Clarity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.contentQuality.structure}</div>
                  <div className="text-sm text-muted-foreground">Structure</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.contentQuality.completeness}</div>
                  <div className="text-sm text-muted-foreground">Completeness</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.technicalSEO && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Technical SEO</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.titleOptimization}</div>
                  <div className="text-xs text-muted-foreground">Title</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.metaDescription}</div>
                  <div className="text-xs text-muted-foreground">Description</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.headingStructure}</div>
                  <div className="text-xs text-muted-foreground">Headings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.contentDepth}</div>
                  <div className="text-xs text-muted-foreground">Depth</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.semanticMarkup}</div>
                  <div className="text-xs text-muted-foreground">Markup</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.technicalSEO.schemaMarkup}</div>
                  <div className="text-xs text-muted-foreground">Schema</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.keywordAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {analysis.keywordAnalysis.primaryKeywords.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Primary Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordAnalysis.primaryKeywords.map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.keywordAnalysis.longTailKeywords.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Long-tail Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordAnalysis.longTailKeywords.slice(0, 3).map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.llmOptimization && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">LLM Optimization</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.topicCoverage}</div>
                  <div className="text-xs text-muted-foreground">Topic Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.answerableQuestions}</div>
                  <div className="text-xs text-muted-foreground">Answerable Qs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.definitionsPresent ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-muted-foreground">Definitions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.faqsPresent ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-muted-foreground">FAQs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.citationFriendly ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-muted-foreground">Citation</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.llmOptimization.structuredData ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-muted-foreground">Structured</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.issues.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Issues Found
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysis.issues.slice(0, 3).map((issue, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Key Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysis.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
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
          Start Optimization
        </Button>
      </div>
    </div>
  );
}

