"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Target,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Type,
  FileText,
  Heading,
  PenTool,
  Code,
  Image,
  Link
} from "lucide-react";
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

interface ValidationError {
  field: string;
  message: string;
}

// Section configurations
const SECTION_CONFIGS = {
  title: {
    label: "Page Title",
    description: "Optimize your page title for better SEO and click-through rates",
    icon: Type,
    maxLength: 60,
    minLength: 10,
    validationRules: {
      required: true,
      maxLength: 60,
      minLength: 10,
      noDuplicateWords: true,
      includeKeywords: true
    }
  },
  description: {
    label: "Meta Description",
    description: "Create compelling meta descriptions that drive clicks from search results",
    icon: FileText,
    maxLength: 160,
    minLength: 50,
    validationRules: {
      required: true,
      maxLength: 160,
      minLength: 50,
      includeKeywords: true,
      callToAction: true
    }
  },
  headings: {
    label: "Heading Structure",
    description: "Structure your content with clear, descriptive headings",
    icon: Heading,
    maxLength: 500,
    minLength: 100,
    validationRules: {
      required: true,
      maxLength: 500,
      minLength: 100,
      properHierarchy: true,
      includeKeywords: true
    }
  },
  content: {
    label: "Content Quality",
    description: "Enhance your content with comprehensive information and examples",
    icon: PenTool,
    maxLength: 2000,
    minLength: 200,
    validationRules: {
      required: true,
      maxLength: 2000,
      minLength: 200,
      readability: true,
      includeKeywords: true
    }
  },
  schema: {
    label: "Schema Markup",
    description: "Add structured data to help search engines understand your content",
    icon: Code,
    maxLength: 1000,
    minLength: 50,
    validationRules: {
      required: true,
      maxLength: 1000,
      minLength: 50,
      validJSON: true,
      properSchema: true
    }
  },
  images: {
    label: "Image Optimization",
    description: "Optimize images with proper alt text and relevance",
    icon: Image,
    maxLength: 800,
    minLength: 100,
    validationRules: {
      required: true,
      maxLength: 800,
      minLength: 100,
      includeKeywords: true,
      descriptive: true
    }
  },
  links: {
    label: "Internal Linking",
    description: "Improve internal linking strategy for better user experience",
    icon: Link,
    maxLength: 600,
    minLength: 100,
    validationRules: {
      required: true,
      maxLength: 600,
      minLength: 100,
      includeKeywords: true,
      relevantLinks: true
    }
  }
} as const;

// Validation functions
const validateContent = (content: string, sectionType: string): ValidationError[] => {
  const config = SECTION_CONFIGS[sectionType as keyof typeof SECTION_CONFIGS];
  const errors: ValidationError[] = [];

  if (!config) {
    errors.push({ field: "sectionType", message: "Invalid section type" });
    return errors;
  }

  const { validationRules } = config;

  // Required validation
  if (validationRules.required && !content.trim()) {
    errors.push({ field: "content", message: "Content is required" });
  }

  // Length validations
  if (content.length > config.maxLength) {
    errors.push({ 
      field: "content", 
      message: `Content must be ${config.maxLength} characters or less` 
    });
  }

  if (content.length < config.minLength) {
    errors.push({ 
      field: "content", 
      message: `Content must be at least ${config.minLength} characters` 
    });
  }

  // Custom validations
  if (validationRules.noDuplicateWords) {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > uniqueWords.size + 2) {
      errors.push({ 
        field: "content", 
        message: "Content contains too many duplicate words" 
      });
    }
  }

  if (validationRules.includeKeywords) {
    // Basic keyword check - in real implementation, this would check against actual keywords
    if (content.length > 0 && content.split(' ').length < 3) {
      errors.push({ 
        field: "content", 
        message: "Content should include relevant keywords" 
      });
    }
  }

  if (validationRules.callToAction && sectionType === 'description') {
    const ctaWords = ['learn', 'discover', 'find', 'get', 'try', 'start', 'explore'];
    const hasCTA = ctaWords.some(word => content.toLowerCase().includes(word));
    if (!hasCTA) {
      errors.push({ 
        field: "content", 
        message: "Meta description should include a call-to-action" 
      });
    }
  }

  if (validationRules.validJSON && sectionType === 'schema') {
    try {
      JSON.parse(content);
    } catch {
      errors.push({ 
        field: "content", 
        message: "Schema markup must be valid JSON" 
      });
    }
  }

  return errors;
};

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
  
  // Apply score multiplier based on current score
  let multiplier = 1.0;
  if (currentScore < 3) multiplier = 1.3;
  else if (currentScore < 5) multiplier = 1.2;
  else if (currentScore < 7) multiplier = 1.0;
  else if (currentScore < 9) multiplier = 0.7;
  else multiplier = 0.3;
  
  improvement *= multiplier;
  return Math.max(0.5, improvement); // Minimum improvement
};

export default function SectionImprovementModal({
  isOpen,
  pageId,
  sectionType,
  recommendations,
  currentScore,
  onClose,
  onContentGenerated,
}: SectionImprovementModalProps) {
  const { getToken } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [estimatedNewScore, setEstimatedNewScore] = useState<number>(currentScore);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const totalSteps = 4;
  const config = SECTION_CONFIGS[sectionType as keyof typeof SECTION_CONFIGS];
  const IconComponent = config?.icon || Target;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedRecommendations([]);
      setGeneratedContent("");
      setEstimatedNewScore(currentScore);
      setValidationErrors([]);
    }
  }, [isOpen, currentScore]);

  // Validation
  const validateStep = (step: number): boolean => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    switch (step) {
      case 1:
        if (selectedRecommendations.length === 0) {
          errors.push({ 
            field: "recommendations", 
            message: "Please select at least one recommendation" 
          });
        }
        break;
      case 2:
        // Step 2 is just generation, no validation needed
        break;
      case 3:
        if (generatedContent.trim()) {
          const contentErrors = validateContent(generatedContent, sectionType);
          errors.push(...contentErrors);
        }
        break;
    }

    setValidationErrors(errors);
    setIsValidating(false);
    return errors.length === 0;
  };

  // Character count helper
  const getCharacterCount = () => {
    if (!generatedContent) return 0;
    return generatedContent.length;
  };

  const getCharacterCountColor = () => {
    const count = getCharacterCount();
    const config = SECTION_CONFIGS[sectionType as keyof typeof SECTION_CONFIGS];
    if (!config) return "text-gray-500";
    
    if (count < config.minLength) return "text-red-500";
    if (count > config.maxLength) return "text-red-500";
    if (count > config.maxLength * 0.9) return "text-yellow-500";
    return "text-green-500";
  };

  // Handlers
  const handleRecommendationToggle = (recommendation: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(recommendation)
        ? prev.filter(r => r !== recommendation)
        : [...prev, recommendation]
    );
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        const improvement = calculateScoreImprovement(selectedRecommendations, currentScore);
        setEstimatedNewScore(Math.min(10, currentScore + improvement));
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setValidationErrors([]);
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const data = await generateSectionContent(
        token,
        pageId,
        sectionType,
        selectedRecommendations,
        '',
        `Generate optimized ${sectionType} content based on selected recommendations`
      );
      
      if (data.generatedContent) {
        const newEstimatedScore = Math.min(10, currentScore + data.estimatedScoreImprovement);
        setEstimatedNewScore(newEstimatedScore);

        // Save content
        const contentTypeMap: { [key: string]: string } = {
          title: 'title',
          description: 'description',
          headings: 'paragraph',
          content: 'paragraph',
          schema: 'schema',
          images: 'paragraph',
          links: 'paragraph'
        };

        const contentType = contentTypeMap[sectionType] || 'paragraph';
        
        await savePageContent(
          token,
          pageId,
          contentType as "title" | "description" | "faq" | "paragraph" | "keywords" | "schema",
          data.generatedContent,
          '',
          `Generated based on ${selectedRecommendations.length} selected recommendations: ${selectedRecommendations.join(', ')}`,
          {
            sectionType,
            recommendationsAddressed: data.recommendationsAddressed,
            keyPoints: data.keyPoints,
            estimatedScoreImprovement: data.estimatedScoreImprovement
          },
          true
        );

        // Update section rating
        await updateSectionRating(
          token,
          pageId,
          sectionType,
          newEstimatedScore,
          data.generatedContent,
          'gpt-4o-mini'
        );

        const formattedContent = `✅ Content Generated, Saved & Deployed Successfully!\n\nAI-generated ${sectionType} content based on your selected recommendations:\n\n${data.recommendationsAddressed.map((rec: string) => `• ${rec}`).join('\n')}\n\n---\n\nGenerated Content:\n${data.generatedContent}\n\n---\n\nKey Improvements:\n${data.keyPoints.map((point: string) => `• ${point}`).join('\n')}\n\n✅ Your ${sectionType} score has been updated from ${currentScore}/10 to ${newEstimatedScore}/10.`;
        
        setGeneratedContent(formattedContent);
      } else {
        throw new Error('No generated content received from API');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      const fallbackContent = `❌ Content generation failed. Please try again.\n\nSelected recommendations:\n${selectedRecommendations.map(rec => `• ${rec}`).join('\n')}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setGeneratedContent(fallbackContent);
    }
    
    setGenerating(false);
    setCurrentStep(3);
  };

  const handleComplete = () => {
    onContentGenerated(generatedContent, estimatedNewScore);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <IconComponent className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Improve {config.label}</h2>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Select Recommendations</span>
              <span>Generate Content</span>
              <span>Review & Deploy</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Select Recommendations */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Select Recommendations to Address</h3>
              </div>
              
              <p className="text-muted-foreground">
                Choose which AI recommendations you'd like to implement. Each selected recommendation 
                will contribute to improving your {sectionType} score.
              </p>
              
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedRecommendations.includes(recommendation)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => handleRecommendationToggle(recommendation)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRecommendations.includes(recommendation)}
                        onChange={() => handleRecommendationToggle(recommendation)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm">{recommendation}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Estimated impact: +{(() => {
                            const lowerRec = recommendation.toLowerCase();
                            if (lowerRec.includes('primary keywords') || lowerRec.includes('compelling') || lowerRec.includes('action-oriented')) {
                              return '2.5';
                            } else if (lowerRec.includes('length') || lowerRec.includes('emotional') || lowerRec.includes('power words') || lowerRec.includes('click-worthy')) {
                              return '2.0';
                            } else if (lowerRec.includes('brand name') || lowerRec.includes('serp display') || lowerRec.includes('benefit-focused')) {
                              return '1.5';
                            } else {
                              return '1.0';
                            }
                          })()} points
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Please fix the following errors:</span>
                  </div>
                  <ul className="mt-2 text-sm text-red-600 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Score:</span>
                  <span className={cn("ml-2 font-semibold", getScoreColor(currentScore))}>
                    {currentScore}/10
                  </span>
                </div>
                <Button
                  onClick={handleNextStep}
                  disabled={selectedRecommendations.length === 0 || isValidating}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Generate Content */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Generate AI-Optimized Content</h3>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Recommendations</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{currentScore}/10</div>
                  <div className="text-sm text-muted-foreground">Current Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{estimatedNewScore}/10</div>
                  <div className="text-sm text-green-600">Estimated New Score</div>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  Potential Improvement: +{estimatedNewScore - currentScore} points
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This could boost your overall page score significantly!
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleGenerateContent} disabled={generating}>
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Deploy */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-4 text-green-600" />
                <h3 className="text-lg font-semibold">Content Generated & Deployed Successfully!</h3>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">✅ Content Successfully Generated & Deployed</h4>
                <div className="space-y-2">
                  <pre className="text-sm whitespace-pre-wrap text-green-700 max-h-40 overflow-y-auto">{generatedContent}</pre>
                  <div className="flex justify-between items-center text-xs">
                    <span className={cn("font-medium", getCharacterCountColor())}>
                      {getCharacterCount()} characters
                    </span>
                    <span className="text-muted-foreground">
                      {config?.minLength}-{config?.maxLength} characters recommended
                    </span>
                  </div>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Content validation warnings:</span>
                  </div>
                  <ul className="mt-2 text-sm text-yellow-600 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{currentScore}/10</div>
                  <div className="text-sm text-muted-foreground">Previous Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{estimatedNewScore}/10</div>
                  <div className="text-sm text-green-600">New Score</div>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-lg font-semibold text-green-700">
                  ✅ Score Improved by +{estimatedNewScore - currentScore} points!
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your {sectionType} has been optimized and deployed successfully!
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-600">Improvement Complete!</h3>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  {config.label} Successfully Improved!
                </h3>
                <p className="text-green-600">
                  Your {sectionType} score has been updated from {currentScore}/10 to {estimatedNewScore}/10
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{currentScore}/10</div>
                  <div className="text-sm text-muted-foreground">Previous Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{estimatedNewScore}/10</div>
                  <div className="text-sm text-green-600">New Score</div>
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  The content has been deployed and your section score has been updated.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
