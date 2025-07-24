"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { generateContentSuggestions, getCachedContentSuggestions, getOriginalPageContent, OriginalPageContent } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Loader2, Sparkles, Copy, Check, MessageSquare } from "lucide-react";
import Toast from "./Toast";
import { Input } from "./ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";

interface FAQEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  currentContent?: string;
  onSave: (content: string, deployImmediately?: boolean) => void;
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQEditorModal({
  isOpen,
  onClose,
  pageId,
  currentContent = '',
  onSave,
  title,
  description
}: FAQEditorModalProps) {
  const { getToken } = useAuth();
  const [faqList, setFaqList] = useState<FAQ[]>([]);
  const [suggestions, setSuggestions] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    // Only preload FAQ list when modal opens for the first time (or when currentContent changes)
    if (isOpen) {
      let initialFaqs: FAQ[] = [];
      try {
        if (currentContent) {
          const parsed = JSON.parse(currentContent);
          if (Array.isArray(parsed)) initialFaqs = parsed;
        }
      } catch {}
      setFaqList(initialFaqs);
      setSuggestions([]);
      loadExistingSuggestions();
    }
  }, [currentContent, isOpen]);

  const loadExistingSuggestions = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getCachedContentSuggestions(token, pageId, 'faq');
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
      const result = await generateContentSuggestions(token, pageId, 'faq', JSON.stringify(faqList), '');
      // Only add new suggestions, do not overwrite existing list
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

  const addFaq = () => setFaqList([...faqList, { question: '', answer: '' }]);
  const removeFaq = (index: number) => setFaqList(faqList.filter((_, i) => i !== index));
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqList(faqList.map((faq, i) => i === index ? { ...faq, [field]: value } : faq));
  };
  const applySuggestion = (faq: FAQ) => {
    // Prevent duplicate Q&A
    if (!faqList.some(f => f.question === faq.question && f.answer === faq.answer)) {
      setFaqList([...faqList, faq]);
    }
  };

  const handleSaveAndDeploy = async () => {
    if (!faqList.length || faqList.some(faq => !faq.question.trim() || !faq.answer.trim())) return;
    setDeploying(true);
    try {
      await onSave(JSON.stringify(faqList), true);
      setToast({ message: 'FAQ saved and deployed successfully!', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ message: error?.message || 'Failed to deploy FAQ', type: 'error' });
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
              <MessageSquare className="h-5 w-5" />
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>FAQ List</Label>
              <Button variant="outline" size="sm" onClick={addFaq}>+ Add Q&A</Button>
            </div>
            {faqList.length === 0 && <div className="text-muted-foreground text-sm">No FAQs yet. Add one above.</div>}
            <Accordion type="multiple" className="w-full">
              {faqList.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border border-border rounded mb-2 bg-muted">
                  <AccordionTrigger className="px-4 py-2 text-left">
                    {faq.question ? faq.question : `Q&A #${idx + 1}`}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 flex flex-col gap-2">
                    <Input
                      placeholder="Question"
                      value={faq.question}
                      onChange={e => updateFaq(idx, 'question', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={e => updateFaq(idx, 'answer', e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => removeFaq(idx)} className="text-destructive">Remove</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={addFaq}>+ Add Q&A</Button>
            </div>
            <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI Suggestions
            </Button>
            {suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.answer}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Q: ${suggestion.question}\nA: ${suggestion.answer}`, index)} className="w-full sm:w-auto">
                          {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySuggestion(suggestion)} className="w-full sm:w-auto">
                          Add to List
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
            <Button onClick={handleSaveAndDeploy} disabled={!faqList.length || faqList.some(faq => !faq.question.trim() || !faq.answer.trim()) || deploying} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              {deploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save & Deploy FAQs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 