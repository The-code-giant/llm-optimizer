"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
interface SectionImprovementModalProps {
  isOpen: boolean;
  pageId: string;
  sectionType: string;
  recommendations: string[];
  currentScore: number;
  onClose: () => void;
  onContentGenerated: (content: string, newScore: number) => void;
}

// Component for modal improvements - validation removed per user request

const calculateScoreImprovement = (recommendations: string[], currentScore: number): number => {
  let improvement = 0;
  
  for (const rec of recommendations) {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('primary keywords') || lowerRec.includes('compelling') || lowerRec.includes('action-oriented')) {
      improvement += 2.5;
    } else if (lowerRec.includes('length') || lowerRec.includes('emotional') || lowerRec.includes('power words') || lowerRec.includes('click-worthy')) {
      improvement += 2.0;
    } else if (lowerRec.includes('brand name') || lowerRec.includes('serp display') || lowerRec.includes('benefit-focused')) {
      improvement += 1.5;
    } else {
      improvement += 1.0;
    }
  }
  
  // Cap the final score at 10
  if (currentScore + improvement > 10) {
    return Math.max(0.1, 10 - currentScore);
  }
  
  return improvement;
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
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [estimatedNewScore, setEstimatedNewScore] = useState<number>(currentScore);

  const totalSteps = 3;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setGenerating(false);
      setGeneratedContent("");
      setSelectedRecommendations([]);
      setEstimatedNewScore(currentScore);
    }
  }, [isOpen, currentScore]);

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
        selectedRecommendations
      );

      if (result && result.generatedContent) {
        setGeneratedContent(result.generatedContent);
        // Move to step 2 (Review & Regenerate) after generation
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      // Handle error
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
      setCurrentStep(3);
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
                      selectedRecommendations.includes(rec)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => {
                      setSelectedRecommendations(prev =>
                        prev.includes(rec)
                          ? prev.filter(r => r !== rec)
                          : [...prev, rec]
                      );
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-4 h-4 border-2 rounded mt-0.5",
                        selectedRecommendations.includes(rec)
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      )}>
                        {selectedRecommendations.includes(rec) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm">{rec}</p>
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

              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium mb-2">Generated Content:</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getCharacterCount()} characters
                  </p>
                </div>

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
                  <h4 className="font-medium text-green-800 mb-2">Improvement Summary</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Previous Score: {currentScore.toFixed(1)}/10</p>
                    <p>New Score: {estimatedNewScore.toFixed(1)}/10</p>
                    <p className="font-medium">Improvement: +{(estimatedNewScore - currentScore).toFixed(1)} points</p>
                  </div>
                </div>

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
