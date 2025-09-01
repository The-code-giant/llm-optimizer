"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Zap, 
  FileText, 
  Hash, 
  MessageSquare, 
  Code, 
  Search,
  Info,
  Save,
  RotateCcw
} from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

type OptimizationType = "title" | "description" | "faq" | "paragraph" | "keywords" | "schema";

interface OptimizationOption {
  value: OptimizationType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const optimizationOptions: OptimizationOption[] = [
  {
    value: "title",
    label: "Page Titles",
    description: "Optimize meta titles for better search visibility",
    icon: <FileText className="h-4 w-4" />
  },
  {
    value: "description",
    label: "Meta Descriptions",
    description: "Enhance meta descriptions for higher CTR",
    icon: <FileText className="h-4 w-4" />
  },
  {
    value: "faq",
    label: "FAQ Schema",
    description: "Generate and optimize FAQ structured data",
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    value: "paragraph",
    label: "Content Paragraphs",
    description: "Improve paragraph readability and SEO",
    icon: <FileText className="h-4 w-4" />
  },
  {
    value: "keywords",
    label: "Keywords",
    description: "Optimize keyword density and placement",
    icon: <Hash className="h-4 w-4" />
  },
  {
    value: "schema",
    label: "Schema Markup",
    description: "Add structured data for rich snippets",
    icon: <Code className="h-4 w-4" />
  }
];

// Mock data for demonstration
const mockSites = [
  { id: "1", name: "example.com", url: "https://example.com" },
  { id: "2", name: "mysite.com", url: "https://mysite.com" },
  { id: "3", name: "business.com", url: "https://business.com" }
];

export default function AutoAgentConfigPage() {
  const [selectedSite, setSelectedSite] = useState(mockSites[0].id);
  const [isActive, setIsActive] = useState(false);
  const [actionType, setActionType] = useState<"recommend" | "auto-deploy">("recommend");
  const [maxPages, setMaxPages] = useState([10]);
  const [selectedOptimizations, setSelectedOptimizations] = useState<OptimizationType[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleOptimizationToggle = (optimization: OptimizationType) => {
    setSelectedOptimizations(prev => 
      prev.includes(optimization)
        ? prev.filter(opt => opt !== optimization)
        : [...prev, optimization]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call
    await saveAutoAgentSettings({
      siteId: selectedSite,
      isActive: isActive ? 1 : 0,
      actionType,
      maxPages: maxPages[0],
      optimizationType: selectedOptimizations
    });
    setIsSaving(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setActionType("recommend");
    setMaxPages([10]);
    setSelectedOptimizations([]);
  };

  return (
    <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
  >
    <AppSidebar variant="inset" />
    <SidebarInset>
    <SiteHeader />
    <div className="min-h-screen bg-background">
      {/* <SiteHeader /> */}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Auto-Agent Configuration</h1>
          </div>
          <p className="text-muted-foreground">
            Configure automated SEO optimization settings for your sites
          </p>
        </div>

        {/* Site Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Site</CardTitle>
            <CardDescription>Choose which site to configure auto-agent settings for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockSites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSite === site.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{site.name}</div>
                  <div className="text-sm text-muted-foreground">{site.url}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Core Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Auto-Agent Status
                </CardTitle>
                <CardDescription>Enable or disable the auto-agent for this site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="agent-active" className="text-base">
                      Active Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the agent will automatically optimize your content
                    </p>
                  </div>
                  <Switch
                    id="agent-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Type */}
            <Card>
              <CardHeader>
                <CardTitle>Action Mode</CardTitle>
                <CardDescription>Choose how the agent should handle optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={actionType} onValueChange={(value) => setActionType(value as "recommend" | "auto-deploy")}>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="recommend" id="recommend" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="recommend" className="text-base font-medium cursor-pointer">
                          Recommend Only
                          <Badge variant="secondary" className="ml-2">Safer</Badge>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          The agent will suggest optimizations for your review before applying
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="auto-deploy" id="auto-deploy" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="auto-deploy" className="text-base font-medium cursor-pointer">
                          Auto-Deploy
                          <Badge variant="default" className="ml-2">Advanced</Badge>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Automatically apply optimizations without manual review
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Optimization Types */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Types</CardTitle>
                <CardDescription>Select which elements the agent should optimize</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optimizationOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedOptimizations.includes(option.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleOptimizationToggle(option.value)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedOptimizations.includes(option.value)}
                          onCheckedChange={() => handleOptimizationToggle(option.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {option.icon}
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Settings */}
          <div className="space-y-6">
            {/* Page Limit */}
            <Card>
              <CardHeader>
                <CardTitle>Page Limit</CardTitle>
                <CardDescription>Maximum pages to optimize per run</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Max Pages</span>
                    <span className="text-sm font-bold text-primary">{maxPages[0]}</span>
                  </div>
                  <Slider
                    value={maxPages}
                    onValueChange={setMaxPages}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 page</span>
                    <span>50 pages</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="text-sm font-medium capitalize">{actionType.replace("-", " ")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Page Limit</span>
                    <span className="text-sm font-medium">{maxPages[0]} pages</span>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Optimizations</span>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedOptimizations.length > 0 ? (
                        selectedOptimizations.map(opt => (
                          <Badge key={opt} variant="outline" className="text-xs">
                            {optimizationOptions.find(o => o.value === opt)?.label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">None selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Changes will take effect immediately after saving. The agent runs every 24 hours
                or can be triggered manually from the dashboard.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedOptimizations.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
    </SidebarInset>
    </SidebarProvider>
  );
}

// API function placeholder
async function saveAutoAgentSettings(settings: {
  siteId: string;
  isActive: number;
  actionType: string;
  maxPages: number;
  optimizationType: OptimizationType[];
}) {
  // TODO: Implement API call
  console.log("Saving settings:", settings);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}