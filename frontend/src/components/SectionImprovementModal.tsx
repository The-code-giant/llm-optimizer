"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Target, 
  Lightbulb, 
  Wand2, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import { generateSectionContent, savePageContent, updateSectionRating } from "@/lib/api";
import { cn } from "@/lib/utils";

// Types
interface Recommendation {
  title: string;
  priority: string;
  description: string;
  expectedImpact: number;
  implementation: string;
}

interface SectionImprovementModalProps {
  isOpen: boolean;
  pageId: string;
  sectionType: string;
  recommendations: Recommendation[];
  currentScore: number;
  onClose: () => void;
  onContentGenerated: (content: string, newScore: number) => void;
}

// Component for modal improvements - validation removed per user request

const calculateScoreImprovement = (recommendations: Recommendation[], currentScore: number): number => {
  let improvement = 0;
  
  for (const rec of recommendations) {
    improvement += rec.expectedImpact;
  }
  
  // Simple improvement calculation - ensure minimum improvement and cap at 10
  const finalImprovement = Math.max(0.5, improvement);
  
  // Don't allow final score to exceed 10
  if (currentScore + finalImprovement > 10) {
    return Math.max(0.5, 10 - currentScore);
  }
  
  return finalImprovement;
};

export default function SectionImprovementModal({
  isOpen,
  pageId,
  sectionType,
  recommendations,
  currentScore,
  onClose,
  onContentGenerated
}: SectionImprovementModalProps) {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<Recommendation[]>([]);
  const [estimatedNewScore, setEstimatedNewScore] = useState<number>(currentScore);
  
  // Additional AI generation details
  const [aiKeyPoints, setAiKeyPoints] = useState<string[]>([]);
  const [aiRecommendationsAddressed, setAiRecommendationsAddressed] = useState<string[]>([]);
  const [aiGenerationContext, setAiGenerationContext] = useState<string>("");
  const [originalRawContent, setOriginalRawContent] = useState<string>(""); // Track original before cleaning

  const totalSteps = 3;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setGenerating(false);
      setGeneratedContent("");
      setSelectedRecommendations([]);
      setEstimatedNewScore(currentScore);
      setAiKeyPoints([]);
      setAiRecommendationsAddressed([]);
      setAiGenerationContext("");
      setOriginalRawContent("");
    }
  }, [isOpen, currentScore]);

  // Helper function to clean schema content (safety net)
  const cleanSchemaContent = (content: string): string => {
    if (sectionType !== 'schema') return content;
    
    // Backend should now generate clean JSON, but keep this as safety net
    try {
      // If it's already clean JSON, just format it
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, try to extract from HTML (fallback)
      const scriptRegex = /<script type=['"]application\/ld\+json['"]>\s*([\s\S]*?)\s*<\/script>/;
      const scriptMatch = content.match(scriptRegex);
      if (scriptMatch) {
        try {
          const jsonContent = scriptMatch[1].trim();
          const parsed = JSON.parse(jsonContent);
          return JSON.stringify(parsed, null, 2);
        } catch (error) {
          console.warn('Invalid JSON in schema content:', error);
          return scriptMatch[1].trim();
        }
      }
      
      // If no script tag found, try to extract JSON directly
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return JSON.stringify(parsed, null, 2);
        }
      } catch (error) {
        console.warn('Could not parse JSON from content:', error);
      }
      
      return content;
    }
  };

  // Character count helper
  const getCharacterCount = () => {
    if (!generatedContent) return 0;
    return generatedContent.length;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedRecommendations.length === 0) return;
      // Skip step 2 and go directly to content generation
      handleGenerateContent();
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle generate content
  const handleGenerateContent = async () => {
    setGenerating(true);
    
    try {
      const token = await getToken();
      if (!token) return;
      
      const improvement = calculateScoreImprovement(selectedRecommendations, currentScore);
      const newScore = Math.min(10, currentScore + improvement);
      setEstimatedNewScore(newScore);

      const result = await generateSectionContent(
        token,
        pageId,
        sectionType,
        selectedRecommendations.map(rec => rec.title),
        undefined, // currentContent
        undefined  // additionalContext
      );

      // Handle the actual API response structure
      // The API returns { success: true, data: { ... } }
      const responseData = result.data || result;
      const actualContent = responseData.generatedContent?.content || responseData.generatedContent || '';
      const actualKeyPoints = responseData.generatedContent?.keyPoints || responseData.keyPoints || [];
      const actualRecommendations = responseData.recommendations || responseData.recommendationsAddressed || [];
      
      console.log('🔍 Debug - Full API Response:', result);
      console.log('🔍 Debug - Response Data:', responseData);
      console.log('🔍 Debug - Extracted Content:', actualContent);
      console.log('🔍 Debug - Extracted Key Points:', actualKeyPoints);
      console.log('🔍 Debug - Extracted Recommendations:', actualRecommendations);
      
      setOriginalRawContent(actualContent); // Store original for comparison
      const cleanedContent = cleanSchemaContent(actualContent);
      console.log('🔍 Debug - Cleaned Content:', cleanedContent);
      setGeneratedContent(cleanedContent);
      setAiKeyPoints(actualKeyPoints);
      setAiRecommendationsAddressed(actualRecommendations);
      setAiGenerationContext(responseData.generationContext || 'AI-generated content based on selected recommendations');
      setCurrentStep(2); // Move to step 2 (Review & Regenerate) instead of 3
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Handle deploy
  const handleDeploy = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      await savePageContent(
        token,
        pageId,
        sectionType as "title" | "description" | "faq" | "paragraph" | "keywords" | "schema",
        generatedContent,
        undefined, // originalContent
        undefined, // generationContext
        undefined, // metadata
        true // deployImmediately
      );

      await updateSectionRating(
        token,
        pageId,
        sectionType,
        estimatedNewScore,
        generatedContent
      );

      onContentGenerated(generatedContent, estimatedNewScore);
      setCurrentStep(3); // Move to final step (3) instead of 4
    } catch (error) {
      console.error("Error deploying content:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Improve {sectionType}</h2>
              <p className="text-sm text-muted-foreground">AI-powered content optimization</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          <Separator />

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">Select Recommendations</h3>
              </div>
              
              <p className="text-muted-foreground">
                Choose which AI recommendations you&apos;d like to implement. Each selected recommendation
                will be used to optimize your content.
              </p>

              <div className="grid gap-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      selectedRecommendations.some(r => r.title === rec.title)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => {
                      setSelectedRecommendations(prev =>
                        prev.some(r => r.title === rec.title)
                          ? prev.filter(r => r.title !== rec.title)
                          : [...prev, rec]
                      );
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-4 h-4 border-2 rounded mt-0.5",
                        selectedRecommendations.some(r => r.title === rec.title)
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      )}>
                        {selectedRecommendations.some(r => r.title === rec.title) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Expected Impact: +{rec.expectedImpact} points
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleNext}
                  disabled={selectedRecommendations.length === 0 || generating}
                >
                  {generating ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Content
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">Review & Regenerate</h3>
              </div>

              <div className="space-y-6">
                {/* Generated Content - Moved to top */}
                {generatedContent && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3">✨ Generated Content</h4>
                    <div className="bg-white p-3 rounded border border-blue-100">
                      <p className="text-sm whitespace-pre-wrap text-gray-900">{generatedContent}</p>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      {getCharacterCount()} characters • Ready to Deploy
                    </p>
                  </div>
                )}

                {/* Success Summary - Only show if content was actually generated */}
                {generatedContent && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Content Generated Successfully!</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Estimated score improvement: {currentScore.toFixed(1)} → {estimatedNewScore.toFixed(1)} 
                      (+{(estimatedNewScore - currentScore).toFixed(1)})
                    </p>
                  </div>
                )}

                {/* AI Improvements Made */}
                {aiRecommendationsAddressed && aiRecommendationsAddressed.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3">🤖 AI Improvements Applied</h4>
                    <div className="space-y-2">
                      {aiRecommendationsAddressed.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-700">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points Enhanced */}
                {aiKeyPoints.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-3">✨ Key Enhancements Made</h4>
                    <div className="space-y-2">
                      {aiKeyPoints.map((point, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-purple-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schema Content Notice */}
                {sectionType === 'schema' && originalRawContent !== generatedContent && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">📋 Schema Content Processing</h4>
                    <p className="text-sm text-yellow-700">
                      The content has been processed to ensure clean JSON-LD format for website injection. 
                      The final schema markup is ready for deployment.
                    </p>
                    <details className="mt-3">
                      <summary className="text-xs text-yellow-600 cursor-pointer hover:text-yellow-800">
                        View original AI output (before processing)
                      </summary>
                      <div className="mt-2 p-2 bg-yellow-100 rounded text-xs max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-yellow-800">{originalRawContent}</pre>
                      </div>
                    </details>
                  </div>
                )}

                {/* Schema Content Success Notice */}
                {sectionType === 'schema' && originalRawContent === generatedContent && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Clean Schema Generated</h4>
                    <p className="text-sm text-green-700">
                      Perfect! The AI generated clean JSON-LD markup that&apos;s ready for direct injection 
                      into your website without any processing needed.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateContent}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    
                    <Button onClick={handleDeploy}>
                      Deploy Changes
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-green-800">
                    {sectionType} Successfully Improved!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your content has been optimized and deployed successfully.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3">📊 Improvement Summary</h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <div className="flex justify-between">
                      <span>Previous Score:</span>
                      <span className="font-medium">{currentScore.toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Score:</span>
                      <span className="font-medium">{estimatedNewScore.toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-2">
                      <span>Improvement:</span>
                      <span className="font-bold text-green-800">+{(estimatedNewScore - currentScore).toFixed(1)} points</span>
                    </div>
                  </div>
                </div>

                {/* Show applied improvements summary */}
                {aiRecommendationsAddressed && aiRecommendationsAddressed.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">✅ Improvements Applied</h4>
                    <p className="text-sm text-blue-700">
                      {aiRecommendationsAddressed.length} recommendation(s) successfully implemented
                    </p>
                  </div>
                )}

                <Button onClick={onClose} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
