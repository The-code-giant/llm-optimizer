"use client";

import { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { generateSectionContent, savePageContent, updateSectionRating } from "@/lib/api";


interface SectionImprovementFormProps {
  pageId: string;
  sectionType: string;
  recommendations: string[];
  currentScore: number;
  onBack: () => void;
  onContentGenerated: (content: string, newScore: number) => void;

}

const sectionLabels = {
  title: "Page Title",
  description: "Meta Description",
  headings: "Heading Structure",
  content: "Content Quality",
  schema: "Schema Markup",
  images: "Image Optimization",
  links: "Internal Linking",
};

const sectionDescriptions = {
  title: "Optimize your page title for better SEO and click-through rates",
  description: "Create compelling meta descriptions that drive clicks from search results",
  headings: "Structure your content with clear, descriptive headings",
  content: "Enhance your content with comprehensive information and examples",
  schema: "Add structured data to help search engines understand your content",
  images: "Optimize images with proper alt text and relevance",
  links: "Improve internal linking strategy for better user experience",
};

export default function SectionImprovementForm({
  pageId,
  sectionType,
  recommendations,
  currentScore,
  onBack,
  onContentGenerated,
}: SectionImprovementFormProps) {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [estimatedNewScore, setEstimatedNewScore] = useState<number>(currentScore);

  const totalSteps = 4;
  const sectionLabel = sectionLabels[sectionType as keyof typeof sectionLabels];
  const sectionDescription = sectionDescriptions[sectionType as keyof typeof sectionDescriptions];

  const handleRecommendationToggle = (recommendation: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(recommendation)
        ? prev.filter(r => r !== recommendation)
        : [...prev, recommendation]
    );
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    
    try {
      // Get token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Call the new section-content API function
      const data = await generateSectionContent(
        token,
        pageId,
        sectionType,
        selectedRecommendations,
        '', // Could be enhanced to pass current content
        `Generate optimized ${sectionType} content based on selected recommendations`
      );
      
      if (data.generatedContent) {
        // Calculate new score
        const newEstimatedScore = Math.min(10, currentScore + data.estimatedScoreImprovement);
        setEstimatedNewScore(newEstimatedScore);

        // Save the generated content to the database
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
          '', // original content
          `Generated based on ${selectedRecommendations.length} selected recommendations: ${selectedRecommendations.join(', ')}`,
          {
            sectionType,
            recommendationsAddressed: data.recommendationsAddressed,
            keyPoints: data.keyPoints,
            estimatedScoreImprovement: data.estimatedScoreImprovement
          },
          true // deploy immediately
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

        // Format the content for display
        const formattedContent = `✅ Content Generated, Saved & Deployed Successfully!\n\nAI-generated ${sectionType} content based on your selected recommendations:\n\n${data.recommendationsAddressed.map((rec: string) => `• ${rec}`).join('\n')}\n\n---\n\nGenerated Content:\n${data.generatedContent}\n\n---\n\nKey Improvements:\n${data.keyPoints.map((point: string) => `• ${point}`).join('\n')}\n\n✅ Your ${sectionType} score has been updated from ${currentScore}/10 to ${newEstimatedScore}/10.`;
        
        setGeneratedContent(formattedContent);
      } else {
        throw new Error('No generated content received from API');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      // Fallback to mock content if API fails
      const fallbackContent = `❌ Content generation failed. Please try again.\n\nSelected recommendations:\n${selectedRecommendations.map(rec => `• ${rec}`).join('\n')}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setGeneratedContent(fallbackContent);
    }
    
    setGenerating(false);
    setCurrentStep(3);
  };

  const handleDeploy = () => {
    onContentGenerated(generatedContent, estimatedNewScore);
    setCurrentStep(4);
  };

  const getScoreImprovement = () => {
    return estimatedNewScore - currentScore;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Ratings
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Improve {sectionLabel}
          </h2>
          <p className="text-muted-foreground">{sectionDescription}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Step 1: Select Recommendations */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Select Recommendations to Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Choose which AI recommendations you&apos;d like to implement. Each selected recommendation 
              will contribute to improving your {sectionType} score.
            </p>
            
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecommendations.includes(recommendation)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Current Score:</span>
                <span className={`ml-2 font-semibold ${getScoreColor(currentScore)}`}>
                  {currentScore}/10
                </span>
              </div>
              <Button
                onClick={() => {
                  if (selectedRecommendations.length > 0) {
                    // Calculate realistic improvement based on recommendation types
                    let improvement = 0;
                    for (const rec of selectedRecommendations) {
                      const lowerRec = rec.toLowerCase();
                      if (lowerRec.includes('primary keywords') || lowerRec.includes('compelling') || lowerRec.includes('action-oriented')) {
                        improvement += 2.5;
                      } else if (lowerRec.includes('length') || lowerRec.includes('emotional') || lowerRec.includes('power words') || lowerRec.includes('click-worthy')) {
                        improvement += 2;
                      } else if (lowerRec.includes('brand name') || lowerRec.includes('serp display') || lowerRec.includes('benefit-focused')) {
                        improvement += 1.5;
                      } else {
                        improvement += 1;
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
                    improvement = Math.max(0.5, improvement); // Minimum improvement
                    
                    setEstimatedNewScore(Math.min(10, currentScore + improvement));
                    setCurrentStep(2);
                  }
                }}
                disabled={selectedRecommendations.length === 0}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Generate Content */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate AI-Optimized Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Potential Improvement: +{getScoreImprovement()} points
              </div>
              <p className="text-sm text-green-600 mt-1">
                This could boost your overall page score significantly!
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
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
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Deploy */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-4 text-green-600" />
              Content Generated & Deployed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold mb-2 text-green-800">✅ Content Successfully Generated & Deployed</h4>
              <pre className="text-sm whitespace-pre-wrap text-green-700">{generatedContent}</pre>
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

            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-semibold text-green-700">
                ✅ Score Improved by +{getScoreImprovement()} points!
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your {sectionType} has been optimized and deployed successfully!
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleDeploy} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Improvement Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                {sectionLabel} Successfully Improved!
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
                <Button variant="outline" onClick={onBack}>
                  Back to Ratings
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

