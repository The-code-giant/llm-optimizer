"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { generateContentSuggestions, getCachedContentSuggestions, getOriginalPageContent, OriginalPageContent } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Loader2, Sparkles, Copy, Check, Edit3 } from "lucide-react";
import Toast from "./Toast";

interface ParagraphEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentContent?: string;
  onSave: (content: string, deployImmediately?: boolean) => void;
  title: string;
  description: string;
}

export default function ParagraphEditorModal({
  isOpen,
  onClose,
  pageId,
  currentContent = '',
  onSave,
  title,
  description
}: ParagraphEditorModalProps) {
  const { getToken } = useAuth();
  const [editedContent, setEditedContent] = useState(currentContent);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    setEditedContent(currentContent);
    setSuggestions([]);
    if (isOpen) {
      loadExistingSuggestions();
    }
  }, [currentContent, isOpen]);

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getCachedContentSuggestions(token, pageId, 'paragraph');
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
      const result = await generateContentSuggestions(token, pageId, 'paragraph', editedContent, '');
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

  const handleSaveAndDeploy = async () => {
    if (!editedContent.trim()) return;
    setDeploying(true);
    try {
      await onSave(editedContent, true);
      setToast({ message: 'Paragraph saved and deployed successfully!', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ message: error?.message || 'Failed to deploy paragraph', type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="content">Paragraph Content</Label>
            <textarea
              id="content"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[200px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter paragraph content..."
            />
            <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI Suggestions
            </Button>
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
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