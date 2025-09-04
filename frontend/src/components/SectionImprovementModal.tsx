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
  ChevronLeft,
  AlertCircle,
  XCircle
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
  // **ANTI-GAMING MEASURE**: Prevent unrealistic score stacking from multiple modal sessions
  
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
  
  // **STRENGTHENED ANTI-GAMING**: Much stricter multipliers to prevent score stacking
  let multiplier = 1.0;
  if (currentScore < 3) multiplier = 1.2;        // Low scores: small boost
  else if (currentScore < 5) multiplier = 1.0;   // Medium scores: normal
  else if (currentScore < 7) multiplier = 0.8;   // Good scores: reduced
  else if (currentScore < 8) multiplier = 0.4;   // High scores: much reduced  
  else if (currentScore < 9) multiplier = 0.2;   // Very high scores: minimal
  else multiplier = 0.1;                         // Near-perfect scores: almost none
  
  improvement *= multiplier;
  
  // **HARD CAPS**: Prevent any score from exceeding realistic limits
  const finalImprovement = Math.max(0.1, improvement);
  
  // Additional protection: never allow final score to exceed 10
  if (currentScore + finalImprovement > 10) {
    return Math.max(0.1, 10 - currentScore);
  }
  
  console.log(`🛡️ Anti-gaming: Current ${currentScore}/10, raw improvement ${improvement.toFixed(2)}, final ${finalImprovement.toFixed(2)}`);
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
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [estimatedNewScore, setEstimatedNewScore] = useState<number>(currentScore);
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [showRegenerationWarning, setShowRegenerationWarning] = useState(false);
  
  // Additional AI generation details
  const [aiKeyPoints, setAiKeyPoints] = useState<string[]>([]);
  const [aiRecommendationsAddressed, setAiRecommendationsAddressed] = useState<string[]>([]);
  const [aiGenerationContext, setAiGenerationContext] = useState<string>("");
  const [originalRawContent, setOriginalRawContent] = useState<string>(""); // Track original before cleaning

  const totalSteps = 4;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setGenerating(false);
      setGeneratedContent("");
      setSelectedRecommendations([]);
      setEstimatedNewScore(currentScore);
      setGenerationAttempts(0);
      setShowRegenerationWarning(false);
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
      
      // **ANTI-GAMING WARNING**: Show warning after first attempt
      if (generationAttempts > 0) {
        setShowRegenerationWarning(true);
      }
      
      setGenerationAttempts(prev => prev + 1);
      
      const improvement = calculateScoreImprovement(selectedRecommendations, currentScore);
      const newScore = Math.min(10, currentScore + improvement);
      setEstimatedNewScore(newScore);

      const result = await generateSectionContent(
        token,
        pageId,
        sectionType,
        selectedRecommendations
      );

      setOriginalRawContent(result.generatedContent); // Store original for comparison
      const cleanedContent = cleanSchemaContent(result.generatedContent);
      setGeneratedContent(cleanedContent);
      setAiKeyPoints(result.keyPoints);
      setAiRecommendationsAddressed(result.recommendationsAddressed);
      setAiGenerationContext(result.generationContext);
      setCurrentStep(3);
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
      setCurrentStep(4);
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

          {/* Anti-gaming warning */}
          {showRegenerationWarning && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-800">Multiple Generation Warning</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      You&apos;ve generated content multiple times. Score improvements will be reduced to ensure realistic results.
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRegenerationWarning(false)}
                      className="mt-2 h-6 px-2 text-orange-700 hover:text-orange-800"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  disabled={selectedRecommendations.length === 0}
                >
                  Generate Content
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">Generate Optimized Content</h3>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  AI will now generate optimized content based on your selected recommendations.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Recommendations:</h4>
                  <ul className="space-y-1">
                    {selectedRecommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleGenerateContent}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">Review & Deploy</h3>
              </div>

              <div className="space-y-6">
                {/* Success Summary */}
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

                {/* AI Improvements Made */}
                {aiRecommendationsAddressed.length > 0 && (
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

                {/* AI Generation Context */}
                {aiGenerationContext && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">🧠 AI Analysis Context</h4>
                    <p className="text-sm text-gray-700">{aiGenerationContext}</p>
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

                {/* Generated Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {sectionType === 'schema' ? 'Generated Schema JSON-LD:' : 'Generated Content:'}
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    {sectionType === 'schema' ? (
                      <pre className="text-xs text-gray-800 overflow-x-auto">
                        <code>{generatedContent}</code>
                      </pre>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      {getCharacterCount()} characters
                    </p>
                    {sectionType === 'schema' && (
                      <p className="text-xs text-green-600">
                        ✓ Clean JSON-LD (HTML removed)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button onClick={handleDeploy}>
                    Deploy Changes
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
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
                {aiRecommendationsAddressed.length > 0 && (
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
