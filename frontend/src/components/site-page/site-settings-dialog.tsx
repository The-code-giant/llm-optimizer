"use client";

import { SiteDetails } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Settings, Target, Trash2 } from "lucide-react";

interface SiteSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteDetails;
  onShowDeleteConfirmation: () => void;
}

export function SiteSettingsDialog({
  isOpen,
  onClose,
  site,
  onShowDeleteConfirmation,
}: SiteSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>
            Manage your site configuration and view site information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Site Information */}
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Basic details and configuration for your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Site Name
                  </label>
                  <p className="text-sm font-medium">{site.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Site URL
                  </label>
                  <p className="text-sm font-medium">{site.url}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tracker ID
                  </label>
                  <p className="font-mono text-sm bg-muted p-2 rounded border">
                    {site.trackerId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        site.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {site.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="text-sm">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Manage site settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Analytics Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable analytics tracking
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Content Optimization</p>
                  <p className="text-xs text-muted-foreground">
                    Manage content optimization settings
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Set up email notifications and alerts
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Site</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this site and all its data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={onShowDeleteConfirmation}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
