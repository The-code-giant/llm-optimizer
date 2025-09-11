"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  siteName,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Site</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{siteName}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">This will permanently delete:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• All pages and their analysis results</li>
                  <li>• All content deployments and optimizations</li>
                  <li>• All analytics data and tracking information</li>
                  <li>• All site settings and configurations</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Site
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
