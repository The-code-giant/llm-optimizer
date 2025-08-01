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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);

  // Ensure initial editedContent is always a string
  useEffect(() => {
    if (typeof currentContent === 'string') {
      // Try to parse as JSON array of paragraphs
      let parsed = null;
      try {
        parsed = JSON.parse(currentContent);
      } catch {}
      if (Array.isArray(parsed)) {
        // Join all paragraphs (heading + content)
        setEditedContent(parsed.map(p => (p.heading ? p.heading + '\n' : '') + (p.content || '')).join('\n\n'));
      } else {
        setEditedContent(currentContent);
      }
    } else if (Array.isArray(currentContent)) {
      setEditedContent(currentContent.map(item => typeof item === 'object' && item !== null ? (item.heading ? item.heading + '\n' : '') + (item.content || '') : String(item)).join('\n\n'));
    } else if (typeof currentContent === 'object' && currentContent !== null) {
      setEditedContent((currentContent.heading ? currentContent.heading + '\n' : '') + (currentContent.content || ''));
    } else {
      setEditedContent('');
    }
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
        const flat = result.suggestions.flat();
        setSuggestions(flat);
        if (!currentContent && flat.length > 0) {
          applySuggestion(flat[0]);
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
      const flat = result.suggestions.flat();
      setSuggestions(flat);
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

  const applySuggestion = (suggestion: any) => {
    // Always set editedContent to a string: heading + content if both, else content, else heading, else ''
    if (typeof suggestion === 'object' && suggestion !== null) {
      const heading = suggestion.heading ? suggestion.heading : '';
      const content = suggestion.content ? suggestion.content : '';
      let value = '';
      if (heading && content) value = heading + '\n' + content;
      else if (content) value = content;
      else if (heading) value = heading;
      setEditedContent(value);
    } else {
      setEditedContent(String(suggestion || ''));
    }
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
        <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border p-0 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 sm:p-0">
            <Label htmlFor="content">Paragraph Content</Label>
            <textarea
              id="content"
              className="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-ring min-h-[200px]"
              value={typeof editedContent === 'string' ? editedContent : ''}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter paragraph content..."
            />
            <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI Suggestions
            </Button>
            {suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => {
                  // Always treat suggestion as object
                  const heading = suggestion && typeof suggestion === 'object' ? suggestion.heading : undefined;
                  const content = suggestion && typeof suggestion === 'object' ? suggestion.content : suggestion;
                  return (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow bg-background border border-border">
                      <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex-1">
                          {heading && <div className="font-semibold mb-1 text-foreground">{heading}</div>}
                          <span className="text-sm text-muted-foreground break-words">{content}</span>
                        </div>
                        <div className="flex flex-row gap-2 mt-2 sm:mt-0">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard((heading ? heading + '\n' : '') + (content || ''))} className="w-full sm:w-auto">
                            {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => applySuggestion(suggestion)} className="w-full sm:w-auto">
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4 p-4 sm:p-0">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveAndDeploy} disabled={!((typeof editedContent === 'string' ? editedContent.trim() : '')) || deploying} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              {deploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 