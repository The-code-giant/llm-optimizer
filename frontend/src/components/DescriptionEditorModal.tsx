"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { generateContentSuggestions, getCachedContentSuggestions, getOriginalPageContent, OriginalPageContent } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Sparkles, Copy, Check, RefreshCw, FileText, Globe, Edit3 } from "lucide-react";
import Toast from "./Toast";

interface DescriptionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentContent?: string;
  onSave: (content: string) => void;
  title: string;
  description: string;
}

export default function DescriptionEditorModal({
  isOpen,
  onClose,
  pageId,
  currentContent = '',
  onSave,
  title,
  description
}: DescriptionEditorModalProps) {
  const { getToken } = useAuth();
  const [editedContent, setEditedContent] = useState(currentContent);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [originalContent, setOriginalContent] = useState<OriginalPageContent | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    setEditedContent(currentContent);
    setSuggestions([]);
    if (isOpen) {
      loadOriginalContent();
      loadExistingSuggestions();
    }
  }, [currentContent, isOpen]);

  const loadOriginalContent = async () => {
    setLoadingOriginal(true);
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getOriginalPageContent(token, pageId);
      setOriginalContent(result);
      if (!currentContent && result.originalContent?.metaDescription) {
        setEditedContent(result.originalContent.metaDescription);
      }
    } catch {}
    setLoadingOriginal(false);
  };

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getCachedContentSuggestions(token, pageId, 'description');
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions[0].suggestions);
        if (!currentContent && result.suggestions[0].suggestions.length > 0) {
          setEditedContent(result.suggestions[0].suggestions[0]);
        }
      }
    } catch {}
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const result = await generateContentSuggestions(token, pageId, 'description', editedContent, '');
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
    } catch {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const applySuggestion = (suggestion: string) => {
    setEditedContent(suggestion);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onSave(editedContent);
      onClose();
      setToast({ message: 'Content saved successfully!', type: 'success' });
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="content">Meta Description</Label>
            <Input
              id="content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter meta description..."
              className="mt-1"
            />
            <div className="flex items-center space-x-2">
              <Badge variant={editedContent.length >= 150 && editedContent.length <= 160 ? "default" : "secondary"}>
                {editedContent.length} chars
              </Badge>
              <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate AI Suggestions
              </Button>
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm text-gray-700">{suggestion}</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion, index)}>
                          {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySuggestion(suggestion)}>
                          Use
                        </Button>
                      </div>
                      <Badge variant={suggestion.length >= 150 && suggestion.length <= 160 ? "default" : "secondary"}>
                        {suggestion.length} chars
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editedContent.trim()} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 