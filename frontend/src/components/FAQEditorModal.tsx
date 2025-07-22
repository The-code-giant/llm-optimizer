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
            {faqList.length === 0 && <div className="text-gray-500 text-sm">No FAQs yet. Add one above.</div>}
            <Accordion type="multiple" className="w-full">
              {faqList.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border rounded mb-2 bg-gray-50">
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
                      <Button variant="ghost" size="sm" onClick={() => removeFaq(idx)} className="text-red-600">Remove</Button>
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
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-1">Click "Add to List" to add any suggestion below to your FAQ list.</div>
                {suggestions.map((faq, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">Q: {faq.question}</span>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${faq.question}\n\n${faq.answer}`, index)}>
                          {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySuggestion(faq)}>
                          Add to List
                        </Button>
                      </div>
                      <div className="text-gray-700 text-sm whitespace-pre-line">A: {faq.answer}</div>
                    </CardContent>
                  </Card>
                ))}
                {suggestions.length > 1 && (
                  <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => suggestions.forEach(applySuggestion)}>
                    Add All to List
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveAndDeploy} disabled={!faqList.length || faqList.some(faq => !faq.question.trim() || !faq.answer.trim()) || deploying} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              {deploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 