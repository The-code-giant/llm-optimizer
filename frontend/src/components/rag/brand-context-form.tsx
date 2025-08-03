"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateRAGContent } from "@/lib/api";

// Zod schema for form validation
const brandContextSchema = z.object({
  contextType: z.enum(['brand_voice', 'content_style', 'target_audience', 'business_goals', 'industry_focus'], {
    required_error: "Please select a context type",
  }),
  topic: z
    .string()
    .min(1, "Topic/Area is required")
    .min(3, "Topic/Area must be at least 3 characters")
    .max(200, "Topic/Area must be less than 200 characters")
    .trim(),
  additionalDetails: z
    .string()
    .max(1000, "Additional details must be less than 1000 characters")
    .optional(),
});

type BrandContextFormData = z.infer<typeof brandContextSchema>;

interface BrandContextFormProps {
  siteId: string;
  pageId?: string;
  onSuccess?: (data: any) => void;
  onError?: (message: string) => void;
}

export function BrandContextForm({ 
  siteId, 
  pageId, 
  onSuccess, 
  onError 
}: BrandContextFormProps) {
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<BrandContextFormData>({
    resolver: zodResolver(brandContextSchema),
    mode: "onChange",
    defaultValues: {
      contextType: 'brand_voice',
      topic: '',
      additionalDetails: '',
    },
  });

  const watchedContextType = watch("contextType");

  const getContextTypeLabel = (type: string) => {
    switch (type) {
      case 'brand_voice': return 'Brand Voice';
      case 'content_style': return 'Content Style';
      case 'target_audience': return 'Target Audience';
      case 'business_goals': return 'Business Goals';
      case 'industry_focus': return 'Industry Focus';
      default: return type;
    }
  };

  const getContentTypeForAPI = (contextType: string) => {
    switch (contextType) {
      case 'brand_voice': return 'title';
      case 'content_style': return 'description';
      case 'target_audience': return 'faq';
      case 'business_goals': return 'paragraph';
      case 'industry_focus': return 'keywords';
      default: return 'title';
    }
  };

  const onSubmit = async (data: BrandContextFormData) => {
    if (!pageId) {
      onError?.("Page ID is required to add brand context");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Convert context type to content type for API
      const contentType = getContentTypeForAPI(data.contextType);
      
      // Generate RAG content with brand context
      const content = await generateRAGContent(
        token,
        pageId,
        contentType as 'title' | 'description' | 'faq' | 'paragraph' | 'keywords',
        data.topic,
        data.additionalDetails
      );

      setGeneratedContent(content);
      onSuccess?.(content);
      
      // Reset form after successful submission
      reset();
      
    } catch (error) {
      console.error('Error adding brand context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add brand context';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Brand Context</CardTitle>
        <CardDescription>
          Help AI better understand your brand, tone, and content style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contextType">Context Type</Label>
              <Select
                value={watchedContextType}
                onValueChange={(value) => setValue("contextType", value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select context type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_voice">Brand Voice</SelectItem>
                  <SelectItem value="content_style">Content Style</SelectItem>
                  <SelectItem value="target_audience">Target Audience</SelectItem>
                  <SelectItem value="business_goals">Business Goals</SelectItem>
                  <SelectItem value="industry_focus">Industry Focus</SelectItem>
                </SelectContent>
              </Select>
              {errors.contextType && (
                <p className="text-sm text-red-500">{errors.contextType.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic">Topic/Area</Label>
              <Input
                id="topic"
                {...register("topic")}
                placeholder="e.g., Professional services, casual tone"
                className="w-full"
              />
              {errors.topic && (
                <p className="text-sm text-red-500">{errors.topic.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additionalDetails">Additional Details</Label>
            <Textarea
              id="additionalDetails"
              {...register("additionalDetails")}
              placeholder="Tell us more about your brand, audience, or specific requirements..."
              className="w-full min-h-[80px] resize-y"
            />
            {errors.additionalDetails && (
              <p className="text-sm text-red-500">{errors.additionalDetails.message}</p>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || !isValid || !pageId}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Add Context
          </Button>
        </form>
        
        {generatedContent && (
          <div className="mt-6 p-4 border rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Context Added Successfully</h4>
            <p className="text-sm mb-2">{generatedContent.content}</p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Understanding: {(generatedContent.ragScore * 100).toFixed(1)}%</span>
              <span>Context Applied: {generatedContent.ragEnhanced ? 'Yes' : 'No'}</span>
              <span>Processed in: {generatedContent.performanceMetrics?.responseTime || 0}ms</span>
            </div>
            {generatedContent.contextSources && generatedContent.contextSources.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground">Based on your website content from:</p>
                <ul className="text-xs text-muted-foreground mt-1">
                  {generatedContent.contextSources.map((source: string, index: number) => (
                    <li key={index}>• {source}</li>
                  ))}
                </ul>
              </div>
            )}
            {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground">Additional context suggestions:</p>
                <ul className="text-xs text-muted-foreground mt-1">
                  {generatedContent.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 