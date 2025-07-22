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
import { Loader2, Sparkles, Copy, Check, RefreshCw, Type, Globe, Edit3 } from "lucide-react";
import Toast from "./Toast";

interface TitleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentContent?: string;
  onSave: (content: string, deployImmediately?: boolean) => void;
  title: string;
  description: string;
}

export default function TitleEditorModal({
  isOpen,
  onClose,
  pageId,
  currentContent = '',
  onSave,
  title,
  description
}: TitleEditorModalProps) {
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
      if (!currentContent && result.originalContent?.title) {
        setEditedContent(result.originalContent.title);
      }
    } catch {}
    setLoadingOriginal(false);
  };

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getCachedContentSuggestions(token, pageId, 'title');
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
      const result = await generateContentSuggestions(token, pageId, 'title', editedContent, '');
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

  const [deploying, setDeploying] = useState(false);
  const handleSaveAndDeploy = async () => {
    if (!editedContent.trim()) return;
    setDeploying(true);
    try {
      await onSave(editedContent, true);
      setToast({ message: 'Title saved and deployed successfully!', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ message: error?.message || 'Failed to deploy title', type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto px-2 sm:px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Type className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="content">Title</Label>
            <Input
              id="content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter title..."
              className="mt-1 w-full"
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Badge variant={editedContent.length >= 50 && editedContent.length <= 60 ? "default" : "secondary"}>
                {editedContent.length} chars
              </Badge>
              <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate AI Suggestions
              </Button>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-col gap-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <span className="text-sm text-gray-700 break-words flex-1">{suggestion}</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion, index)} className="w-full sm:w-auto">
                          {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySuggestion(suggestion)} className="w-full sm:w-auto">
                          Use
                        </Button>
                      </div>
                      <Badge variant={suggestion.length >= 50 && suggestion.length <= 60 ? "default" : "secondary"}>
                        {suggestion.length} chars
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveAndDeploy} disabled={!editedContent.trim() || deploying} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              {deploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 