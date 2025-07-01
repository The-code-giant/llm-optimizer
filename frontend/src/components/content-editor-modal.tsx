"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { generateContentSuggestions, ContentSuggestion, getCachedContentSuggestions } from "../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Edit3,
  MessageSquare,
  FileText,
  Hash,
  Type
} from "lucide-react";
import Toast from "./Toast";

interface ContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  contentType: 'title' | 'description' | 'faq' | 'paragraph' | 'keywords';
  currentContent?: string;
  onSave: (content: string) => void;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface KeywordSuggestions {
  primary: string[];
  longTail: string[];
  semantic: string[];
  missing: string[];
}

export default function ContentEditorModal({
  isOpen,
  onClose,
  pageId,
  contentType,
  currentContent = '',
  onSave,
  title,
  description
}: ContentEditorModalProps) {
  const { getToken } = useAuth();
  const [editedContent, setEditedContent] = useState(currentContent);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    setEditedContent(currentContent);
    setSuggestions(null);
    setSelectedSuggestion('');
    setAdditionalContext('');
    
    // Load existing suggestions when modal opens
    if (isOpen) {
      loadExistingSuggestions();
    }
  }, [currentContent, isOpen]);

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const result = await getCachedContentSuggestions(token, pageId, contentType);
      if (result.suggestions && result.suggestions.length > 0) {
        // Get the latest suggestion for this content type
        const latestSuggestion = result.suggestions[0];
        setSuggestions(latestSuggestion.suggestions);
        
        // If no current content, load the first suggestion as current content
        if (!currentContent && latestSuggestion.suggestions) {
          if (contentType === 'faq' && Array.isArray(latestSuggestion.suggestions)) {
            // For FAQ, format as text
            const faqText = latestSuggestion.suggestions
              .map((faq: FAQ) => `${faq.question}\n\n${faq.answer}`)
              .join('\n\n---\n\n');
            setEditedContent(faqText);
          } else if (Array.isArray(latestSuggestion.suggestions) && latestSuggestion.suggestions.length > 0) {
            // For other content types, use the first suggestion
            setEditedContent(latestSuggestion.suggestions[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load existing suggestions:', error);
      // Don't show error toast, just continue without pre-loaded suggestions
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await generateContentSuggestions(
        token,
        pageId,
        contentType,
        editedContent,
        additionalContext
      );

      setSuggestions(result.suggestions);
      setToast({ message: 'AI suggestions generated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate suggestions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      setToast({ message: 'Copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const applySuggestion = (suggestion: string) => {
    setEditedContent(suggestion);
    setSelectedSuggestion(suggestion);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onSave(editedContent);
      onClose();
      setToast({ message: 'Content saved successfully!', type: 'success' });
    }
  };

  const getIcon = () => {
    switch (contentType) {
      case 'title': return <Type className="h-5 w-5" />;
      case 'description': return <FileText className="h-5 w-5" />;
      case 'faq': return <MessageSquare className="h-5 w-5" />;
      case 'paragraph': return <Edit3 className="h-5 w-5" />;
      case 'keywords': return <Hash className="h-5 w-5" />;
      default: return <Edit3 className="h-5 w-5" />;
    }
  };

  const renderSuggestions = () => {
    if (!suggestions) return null;

    switch (contentType) {
      case 'title':
      case 'description':
      case 'paragraph':
        return (
          <div className="space-y-3">
            {suggestions.map((suggestion: string, index: number) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between space-x-3">
                    <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  {contentType === 'title' && (
                    <div className="mt-2">
                      <Badge variant={suggestion.length >= 50 && suggestion.length <= 60 ? "default" : "secondary"}>
                        {suggestion.length} chars
                      </Badge>
                    </div>
                  )}
                  {contentType === 'description' && (
                    <div className="mt-2">
                      <Badge variant={suggestion.length >= 150 && suggestion.length <= 160 ? "default" : "secondary"}>
                        {suggestion.length} chars
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            {suggestions.faqs?.map((faq: FAQ, index: number) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{faq.answer}</p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${faq.question}\n\n${faq.answer}`, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(`${faq.question}\n\n${faq.answer}`)}
                    >
                      Add FAQ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'keywords':
        const keywordData = suggestions as KeywordSuggestions;
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Primary Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordData.primary?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Long-Tail Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordData.longTail?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Semantic Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywordData.semantic?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-purple-300 text-purple-700">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Missing Opportunities</h4>
              <div className="flex flex-wrap gap-2">
                {keywordData.missing?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => copyToClipboard(JSON.stringify(keywordData, null, 2))}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Keywords as JSON
              </Button>
            </div>
          </div>
        );

      default:
        return <div>No suggestions available</div>;
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getIcon()}
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Editor */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Current Content</Label>
                {contentType === 'faq' ? (
                  <textarea
                    id="content"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[200px]"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Enter FAQ content..."
                  />
                ) : (
                  <Input
                    id="content"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder={`Enter ${contentType}...`}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Input
                  id="context"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any specific requirements or focus areas..."
                  className="mt-1"
                />
              </div>

              <Button
                onClick={generateSuggestions}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate AI Suggestions
              </Button>
            </div>

            {/* Right Side - Suggestions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Suggestions</h3>
                {suggestions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestions}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Generating suggestions...</span>
                </div>
              ) : suggestions ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {renderSuggestions()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Click "Generate AI Suggestions" to get started</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editedContent.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 