"use client";
import { useAuth } from "@clerk/nextjs";
import { Copy, Hash, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { generateContentSuggestions, getCachedContentSuggestions } from "../lib/api";
import Toast from "./Toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";

interface KeywordsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentContent?: string;
  onSave: (content: string, deployImmediately?: boolean) => void;
  title: string;
  description: string;
}

interface KeywordSuggestions {
  primary: string[];
  longTail: string[];
  semantic: string[];
  missing: string[];
}

export default function KeywordsEditorModal({
  isOpen,
  onClose,
  pageId,
  currentContent = '',
  onSave,
  title,
  description
}: KeywordsEditorModalProps) {
  const { getToken } = useAuth();
  const [editedContent, setEditedContent] = useState(currentContent);
  const [suggestions, setSuggestions] = useState<KeywordSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    setEditedContent(currentContent);
    setSuggestions(null);
    if (isOpen) {
      loadExistingSuggestions();
    }
  }, [currentContent, isOpen]);

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getCachedContentSuggestions(token, pageId, 'keywords');
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions[0].suggestions);
      }
    } catch {}
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const result = await generateContentSuggestions(token, pageId, 'keywords', editedContent, '');
      setSuggestions(result.suggestions);
      setToast({ message: 'AI suggestions generated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate suggestions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: 'Copied to clipboard!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const handleSaveAndDeploy = async () => {
    if (!editedContent.trim()) return;
    setDeploying(true);
    try {
      await onSave(editedContent, true);
      setToast({ message: 'Keywords saved and deployed successfully!', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ message: error?.message || 'Failed to deploy keywords', type: 'error' });
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
              <Hash className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="content">Keywords (JSON)</Label>
            <textarea
              id="content"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[120px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Paste or edit keywords JSON..."
            />
            <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI Suggestions
            </Button>
            {suggestions && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Primary Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.primary?.map((keyword, index) => (
                      <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Long-Tail Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.longTail?.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Semantic Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.semantic?.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="border-purple-300 text-purple-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Missing Opportunities</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.missing?.map((keyword, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={() => copyToClipboard(JSON.stringify(suggestions, null, 2))} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Keywords as JSON
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveAndDeploy} disabled={!editedContent.trim() || deploying} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              {deploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 