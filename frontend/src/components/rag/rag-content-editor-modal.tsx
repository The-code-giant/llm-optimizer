'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Sparkles, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getSites, getPageDetails } from '@/lib/api';

interface RAGContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  siteId: string;
  contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords';
  currentContent: string;
  onSave: (content: string, deployImmediately?: boolean) => void;
  title: string;
  description: string;
}

interface GeneratedContent {
  content: string;
  ragEnhanced: boolean;
  contextSources: string[];
  ragScore: number;
  suggestions: string[];
  performanceMetrics: {
    responseTime: number;
    contextRetrievalTime: number;
    generationTime: number;
  };
}

export function RAGContentEditorModal({
  isOpen,
  onClose,
  pageId,
  siteId,
  contentType,
  currentContent,
  onSave,
  title,
  description,
}: RAGContentEditorModalProps) {
  const [content, setContent] = useState(currentContent);
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [ragStatus, setRagStatus] = useState<any>(null);
  const [deployImmediately, setDeployImmediately] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(currentContent);
      loadRAGStatus();
    }
  }, [isOpen, currentContent]);

  const loadRAGStatus = async () => {
    try {
      // For now, we'll simulate RAG status since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      setRagStatus({ status: 'ready', totalDocuments: 25, lastRefresh: new Date().toISOString() });
    } catch (error) {
      console.error('Error loading RAG status:', error);
    }
  };

  const generateContent = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    try {
      // For now, we'll simulate content generation since the API functions don't exist yet
      // In a real implementation, you would add these functions to the API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      
      const mockResponse = {
        content: `Generated ${contentType} for "${topic}": This is a sample ${contentType} that demonstrates RAG-enhanced content generation. It includes contextually relevant information and follows best practices for ${contentType} optimization.`,
        ragEnhanced: true,
        contextSources: ['https://example.com/page1', 'https://example.com/page2'],
        ragScore: 0.85,
        suggestions: [
          'Consider adding more specific keywords',
          'Include a call-to-action',
          'Optimize for featured snippets'
        ],
        performanceMetrics: {
          responseTime: 1500,
          contextRetrievalTime: 800,
          generationTime: 700,
        },
      };
      
      setGeneratedContent(mockResponse);
      
      // Auto-apply generated content if RAG score is high
      if (mockResponse.ragScore > 0.8) {
        setContent(mockResponse.content);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedContent = () => {
    if (generatedContent) {
      setContent(generatedContent.content);
    }
  };

  const copyToClipboard = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    
    setIsSaving(true);
    try {
      await onSave(content, deployImmediately);
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'title': return 'Page Title';
      case 'description': return 'Meta Description';
      case 'faq': return 'FAQ Content';
      case 'paragraph': return 'Content Paragraph';
      case 'keywords': return 'SEO Keywords';
      default: return type;
    }
  };

  const getRAGStatusColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
            {ragStatus?.status === 'ready' && (
              <Badge variant="outline" className="ml-2">
                <Brain className="h-3 w-3 mr-1" />
                RAG Enabled
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* RAG Content Generation */}
          {ragStatus?.status === 'ready' && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">AI Content Generation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., AI SEO optimization"
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Additional Context</label>
                  <input
                    type="text"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Optional additional context..."
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <Button
                onClick={generateContent}
                disabled={isGenerating || !topic}
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate {getContentTypeLabel(contentType)}
              </Button>
              
              {generatedContent && (
                <div className="mt-4 p-4 border rounded-lg bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Generated Content</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`${getRAGStatusColor(generatedContent.ragScore)} text-white`}
                      >
                        {(generatedContent.ragScore * 100).toFixed(1)}% RAG Score
                      </Badge>
                      {generatedContent.ragEnhanced && (
                        <Badge variant="secondary">
                          <Brain className="h-3 w-3 mr-1" />
                          Enhanced
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{generatedContent.content}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={applyGeneratedContent}
                      variant="outline"
                    >
                      Apply to Editor
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={copyToClipboard}
                      variant="outline"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                  
                  {generatedContent.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-1">Suggestions:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {generatedContent.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Content Editor */}
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter your ${getContentTypeLabel(contentType).toLowerCase()}...`}
              className="min-h-[120px] mt-1"
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {content.length} characters
                </span>
                {contentType === 'title' && (
                  <span className={`text-xs ${
                    content.length > 60 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {content.length > 60 ? 'Too long' : 'Good length'}
                  </span>
                )}
                {contentType === 'description' && (
                  <span className={`text-xs ${
                    content.length > 160 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {content.length > 160 ? 'Too long' : 'Good length'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
          </div>

          {/* Deploy Options */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deployImmediately"
              checked={deployImmediately}
              onChange={(e) => setDeployImmediately(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="deployImmediately" className="text-sm">
              Deploy immediately after saving
            </label>
          </div>

          {/* RAG Status Alert */}
          {ragStatus?.status !== 'ready' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                RAG knowledge base is not ready. Content generation will use standard AI models.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={loadRAGStatus}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Check Status
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !content}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Save {deployImmediately ? '& Deploy' : 'Content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 