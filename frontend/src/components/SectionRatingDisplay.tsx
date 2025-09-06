"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  FileText, 
  Hash, 
  Edit3, 
  Image, 
  Link as LinkIcon,
  Database,
  TrendingUp,
  Target
} from "lucide-react";

interface SectionRating {
  title: number;
  description: number;
  headings: number;
  content: number;
  schema: number;
  images: number;
  links: number;
}

interface SectionRecommendations {
  title: string[];
  description: string[];
  headings: string[];
  content: string[];
  schema: string[];
  images: string[];
  links: string[];
}

interface SectionRatingDisplayProps {
  pageId: string;
  sectionRatings?: SectionRating;
  sectionRecommendations?: SectionRecommendations;
  overallScore?: number; // Add overall score from API
  onImproveSection: (sectionType: string, recommendations: string[]) => void;
}

const sectionConfig = {
  title: {
    icon: Type,
    label: "Page Title",
    description: "SEO-optimized title with keywords",
    maxScore: 10,
    color: "bg-blue-500",
  },
  description: {
    icon: FileText,
    label: "Meta Description",
    description: "Compelling description with CTA",
    maxScore: 10,
    color: "bg-green-500",
  },
  headings: {
    icon: Hash,
    label: "Heading Structure",
    description: "Logical H1-H6 hierarchy",
    maxScore: 10,
    color: "bg-purple-500",
  },
  content: {
    icon: Edit3,
    label: "Content Quality",
    description: "Comprehensive and valuable content",
    maxScore: 10,
    color: "bg-orange-500",
  },
  schema: {
    icon: Database,
    label: "Schema Markup",
    description: "Structured data implementation",
    maxScore: 10,
    color: "bg-red-500",
  },
  images: {
    icon: Image,
    label: "Image Optimization",
    description: "Alt text and relevance",
    maxScore: 10,
    color: "bg-pink-500",
  },
  links: {
    icon: LinkIcon,
    label: "Internal Linking",
    description: "Strategic internal link structure",
    maxScore: 10,
    color: "bg-indigo-500",
  },
};

export default function SectionRatingDisplay({
  sectionRatings,
  sectionRecommendations,
  overallScore,
  onImproveSection,
}: SectionRatingDisplayProps) {
  const [currentRatings, setCurrentRatings] = useState<SectionRating | null>(null);
  console.log("sectionRecommendations", {  sectionRatings,
    sectionRecommendations,
    overallScore,});
  useEffect(() => {
    if (sectionRatings) {
      setCurrentRatings(sectionRatings);
    }
  }, [sectionRatings]);

  if (!currentRatings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Section Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No section ratings available yet. Run an analysis to see detailed ratings.</p>
        </CardContent>
      </Card>
    );
  }

  // Use the overall score from API if available, otherwise calculate from section ratings
  const totalScore = overallScore !== undefined ? overallScore : (() => {
    if (!currentRatings) return 0;
    const scores = Object.values(currentRatings);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const maxPossible = scores.length * 10; // 7 sections * 10 = 70
    return Math.round((total / maxPossible) * 100); // Convert to percentage
  })();

  const getScoreBadge = (score: number) => {
    if (score >= 8) return <Badge className="bg-green-500">{score}/10</Badge>;
    if (score >= 6) return <Badge className="bg-yellow-500">{score}/10</Badge>;
    return <Badge className="bg-red-500">{score}/10</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Page Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalScore}%</span>
              <Badge variant={totalScore >= 80 ? "default" : totalScore >= 60 ? "secondary" : "destructive"}>
                {totalScore >= 80 ? "Excellent" : totalScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
            <Progress value={totalScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Based on 7 key sections, each scored from 0-10
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section Ratings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(sectionConfig).map(([sectionType, config]) => {
          const Icon = config.icon;
          const score = currentRatings[sectionType as keyof SectionRating];
          const recommendations = sectionRecommendations?.[sectionType as keyof SectionRecommendations] || [];
          const hasRecommendations = recommendations.length > 0;

          return (
            <Card key={sectionType} id={`${sectionType}-section`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  {getScoreBadge(score)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Score Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Score</span>
                      <span className={getScoreColor(score)}>{score}/10</span>
                    </div>
                    <Progress value={(score / 10) * 100} className="h-2" />
                  </div>

                  {/* Recommendations */}
                  {hasRecommendations && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        AI Recommendations ({recommendations.length})
                      </p>
                      <div className="space-y-1">
                        {recommendations.slice(0, 2).map((rec, index) => (
                          <p key={index} className="text-xs text-muted-foreground line-clamp-2">
                            • {rec}
                          </p>
                        ))}
                        {recommendations.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{recommendations.length - 2} more recommendations
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Improve Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onImproveSection(sectionType, recommendations)}
                    disabled={!hasRecommendations}
                  >
                    {hasRecommendations ? "Improve This Section" : "No Recommendations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Improvement Tips */}
  
    </div>
  );
}

