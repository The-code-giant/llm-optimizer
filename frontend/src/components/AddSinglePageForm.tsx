"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { addPage, triggerAnalysis, getPageAnalysis, generateContentSuggestions, savePageContent, deployPageContent } from "@/lib/api";
import {
  UrlInputForm,
  AnalysisOverview,
  TitleOptimizationForm,
  DescriptionOptimizationForm,
  ContentOptimizationForm,
  KeywordsOptimizationForm,
  OptimizationComplete
} from "./add-page-forms";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface AddSinglePageFormProps {
  siteId: string;
  siteUrl: string;
  onCompleted: () => void;
  onToast?: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

interface PageContent {
  title: string;
  description: string;
  keywords: string[];
  faqs: string[];
}

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

export default function AddSinglePageForm({ siteId, siteUrl, onCompleted, onToast }: AddSinglePageFormProps) {
  const { getToken } = useAuth();
  
  // Form state
  const [currentStep, setCurrentStep] = useState<"url-input" | "analysis" | "title-optimization" | "description-optimization" | "content-optimization" | "keywords-optimization" | "complete">("url-input");
  
  // Page creation state
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"validating" | "creating" | "analyzing" | "finalizing" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);
  
  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Content editing state
  const [pageContent, setPageContent] = useState<PageContent>({
    title: "",
    description: "",
    keywords: [],
    faqs: []
  });

  // AI generation state
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  
  // Track selected suggestions for deployment
  const [selectedTitleSuggestion, setSelectedTitleSuggestion] = useState<string | null>(null);
  const [selectedDescriptionSuggestion, setSelectedDescriptionSuggestion] = useState<string | null>(null);

  const siteHostname = useMemo(() => {
    if (!siteUrl) return null;
    try {
      const u = new URL(siteUrl);
      return u.hostname.replace(/^www\./i, "");
    } catch {
      return null;
    }
  }, [siteUrl]);

  const handleSubmit = async (values: { url: string }) => {
    setAdding(true);
    setProgress(0);
    setPhase("validating");
    setFormError(null);

    try {
      const token = await getToken();
      if (!token) return;

      // Simulate progress
      setProgress(25);
      setPhase("creating");
      
      const created = await addPage(token, siteId, values.url);
      setCreatedPageId(created.id);
      
      setProgress(50);
      setPhase("analyzing");
      
      await triggerAnalysis(token, created.id);
      
      setProgress(75);
      setPhase("finalizing");
      
      const analysisResult = await getPageAnalysis(token, created.id);
      setAnalysis(analysisResult);
      console.log({analysisResult})
      
      // Extract title from analysis if available
      if (analysisResult.summary) {
        try {
          const summary = JSON.parse(analysisResult.summary);
          if (summary.title) {
            setPageContent(prev => ({ ...prev, title: summary.title }));
          }
        } catch {
          // If parsing fails, use the summary as is
          console.warn('Failed to parse analysis summary as JSON');
        }
      }
      
      setProgress(100);
      setPhase(null);
      
      onToast?.({ message: 'Page added and analyzed successfully!', type: 'success' });
      setCurrentStep("analysis");
      
    } catch (error) {
      console.error('Error adding page:', error);
      setFormError('Failed to add page. Please try again.');
      onToast?.({ message: 'Failed to add page', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const goToStep = (step: typeof currentStep) => {
    setCurrentStep(step);
  };

  const handleContentChange = (field: keyof PageContent, value: string | string[]) => {
    setPageContent(prev => ({ ...prev, [field]: value }));
  };

  const generateTitleSuggestions = async () => {
    if (!createdPageId) return;
    setGeneratingTitle(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      const result = await generateContentSuggestions(
        token, 
        createdPageId, 
        'title', 
        pageContent.title,
        'Generate compelling page titles between 50-60 characters'
      );
      
      if (result.suggestions && Array.isArray(result.suggestions)) {
        setTitleSuggestions(result.suggestions);
        onToast?.({ message: 'Title suggestions generated!', type: 'success' });
      } else {
        onToast?.({ message: 'No suggestions generated', type: 'info' });
      }
    } catch {
      onToast?.({ message: 'Failed to generate title suggestions', type: 'error' });
    } finally {
      setGeneratingTitle(false);
    }
  };

  const generateDescriptionSuggestions = async () => {
    if (!createdPageId) return;
    setGeneratingDescription(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      const result = await generateContentSuggestions(
        token, 
        createdPageId, 
        'description', 
        pageContent.description,
        'Generate compelling meta descriptions between 150-160 characters'
      );
      
      if (result.suggestions && Array.isArray(result.suggestions)) {
        setDescriptionSuggestions(result.suggestions);
        onToast?.({ message: 'Description suggestions generated!', type: 'success' });
      } else {
        onToast?.({ message: 'No suggestions generated', type: 'info' });
      }
    } catch {
      onToast?.({ message: 'Failed to generate description suggestions', type: 'error' });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const deploySelectedContent = async (contentType: 'title' | 'description') => {
    if (!createdPageId) return;
    
    try {
      const token = await getToken();
      if (!token) return;
      
      let contentToDeploy = '';
      if (contentType === 'title') {
        contentToDeploy = selectedTitleSuggestion || pageContent.title;
      } else if (contentType === 'description') {
        contentToDeploy = selectedDescriptionSuggestion || pageContent.description;
      }
      
      if (contentToDeploy && contentToDeploy.trim()) {
        // First save the content, then deploy it
        await savePageContent(token, createdPageId, contentType, contentToDeploy, undefined, undefined, undefined, true);
        await deployPageContent(token, createdPageId, contentType);
        
        onToast?.({ 
          message: `${contentType === 'title' ? 'Title' : 'Description'} deployed successfully!`, 
          type: 'success' 
        });
      } else {
        onToast?.({ 
          message: `No ${contentType} content to deploy`, 
          type: 'info' 
        });
      }
      
    } catch (error) {
      console.error(`Failed to deploy ${contentType}:`, error);
      onToast?.({ 
        message: `Failed to deploy ${contentType}`, 
        type: 'error' 
      });
    }
  };

  const handleSkip = () => {
    onToast?.({ message: 'Skipped optimization process', type: 'info' });
    onCompleted();
  };

  const handleComplete = () => {
    onToast?.({ message: 'Optimization completed successfully!', type: 'success' });
    onCompleted();
  };

  console.log({analysis});
  
  const renderStepContent = () => {
    const summary = (() => {
      try {
        return JSON.parse(analysis?.summary || '{}');
      } catch {
        return { recommendations: {} };
      }
    })();
    switch (currentStep) {
      case "url-input":
        return (
          <UrlInputForm
            onSubmit={handleSubmit}
            adding={adding}
            progress={progress}
            phase={phase}
            formError={formError}
            siteHostname={siteHostname}
          />
        );
      
      case "analysis":
        return (
          <AnalysisOverview
            analysis={analysis}
            onSkip={handleSkip}
            onContinue={() => goToStep("title-optimization")}
          />
        );
      
      case "title-optimization":
        return (
          <TitleOptimizationForm
            title={pageContent.title}
            onTitleChange={(title) => {
              handleContentChange('title', title);
              setSelectedTitleSuggestion(title); // Track manually typed content as selected
            }}
            titleSuggestions={titleSuggestions}
            generatingTitle={generatingTitle}
            onGenerateSuggestions={generateTitleSuggestions}
            onSkip={handleSkip}
            onContinue={() => {
              deploySelectedContent('title');
              goToStep("description-optimization");
            }}
            recommendations={summary.recommendations?.title || []}
            onSuggestionSelect={(suggestion) => setSelectedTitleSuggestion(suggestion)}
          />
        );
      
      case "description-optimization":
        return (
          <DescriptionOptimizationForm
            description={pageContent.description}
            onDescriptionChange={(description) => {
              handleContentChange('description', description);
              setSelectedDescriptionSuggestion(description); // Track manually typed content as selected
            }}
            descriptionSuggestions={descriptionSuggestions}
            generatingDescription={generatingDescription}
            onGenerateSuggestions={generateDescriptionSuggestions}
            onSkip={handleSkip}
            onContinue={() => {
              deploySelectedContent('description');
              goToStep("content-optimization");
            }}
            recommendations={summary.recommendations?.description || []}
            onSuggestionSelect={(suggestion) => setSelectedDescriptionSuggestion(suggestion)}
          />
        );
      
      case "content-optimization":
        return (
          <ContentOptimizationForm
            faqs={pageContent.faqs}
            onFaqsChange={(faqs) => handleContentChange('faqs', faqs)}
            onSkip={handleSkip}
            onContinue={() => {
              deploySelectedContent('description');
              goToStep("keywords-optimization");
            }}
            recommendations={summary.recommendations?.content || []}
          />
        );
      
      case "keywords-optimization":
        return (
          <KeywordsOptimizationForm
            keywords={pageContent.keywords}
            onKeywordsChange={(keywords) => handleContentChange('keywords', keywords)}
            onSkip={handleSkip}
            onContinue={() => goToStep("complete")}
            recommendations={summary.recommendations?.keywords || []}
          />
        );
      
      case "complete":
        return (
          <OptimizationComplete
            pageContent={pageContent}
            onSkip={handleSkip}
            onContinue={handleComplete}
          />
        );
      
      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    if (currentStep === "url-input") return null;

    const steps = [
      { id: "analysis", label: "Analysis", icon: "📊" },
      { id: "title-optimization", label: "Title", icon: "📝" },
      { id: "description-optimization", label: "Description", icon: "📄" },
      { id: "content-optimization", label: "Content", icon: "📚" },
      { id: "keywords-optimization", label: "Keywords", icon: "🔍" },
      { id: "complete", label: "Complete", icon: "✅" }
    ];

    const currentIndex = steps.findIndex(step => step.id === currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Optimization Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="w-full mb-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <span className="mb-1">{step.icon}</span>
                <span className={index <= currentIndex ? "text-primary font-medium" : ""}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full">
      {renderStepIndicator()}
      {renderStepContent()}
    </div>
  );
}


