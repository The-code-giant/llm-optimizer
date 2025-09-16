"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeletePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageLabel: string; // title or url
  onConfirm: () => void;
}

export function DeletePageDialog({ isOpen, onClose, pageLabel, onConfirm }: DeletePageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Page</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left">
              <p className="font-medium break-words">Youre about to delete:</p>
              <div className="rounded-md bg-muted px-3 py-2 text-sm break-words">
                {pageLabel}
              </div>
              <p className="text-foreground">This action cannot be undone. It will remove:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Analysis results and scores</li>
                <li>Generated content and drafts</li>
                <li>Recommendations and insights</li>
                <li>Saved suggestions</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="cursor-pointer">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


