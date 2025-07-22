"use client";

import TitleEditorModal from "./TitleEditorModal";
import DescriptionEditorModal from "./DescriptionEditorModal";
import FAQEditorModal from "./FAQEditorModal";
import ParagraphEditorModal from "./ParagraphEditorModal";
import KeywordsEditorModal from "./KeywordsEditorModal";

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

export default function ContentEditorModal(props: ContentEditorModalProps) {
  const { contentType, ...rest } = props;
  if (contentType === 'title') {
    return <TitleEditorModal {...rest} />;
  }
  if (contentType === 'description') {
    return <DescriptionEditorModal {...rest} />;
  }
  if (contentType === 'faq') {
    return <FAQEditorModal {...rest} />;
  }
  if (contentType === 'paragraph') {
    return <ParagraphEditorModal {...rest} />;
  }
  if (contentType === 'keywords') {
    return <KeywordsEditorModal {...rest} />;
  }
  return null;
} 