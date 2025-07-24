"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle,
  Code,
  Copy,
  Globe,
  Settings,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "./Toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

interface TrackerScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
}

interface TrackerScriptData {
  siteId: string;
  siteName: string;
  trackerId: string;
  scriptHtml: string;
  nextJsScript: string; // Add Next.js Script format
  instructions: {
    installation: string;
    verification: string;
    support: string;
  };
}

export default function TrackerScriptModal({
  isOpen,
  onClose,
  siteId,
  siteName
}: TrackerScriptModalProps) {
  const { getToken } = useAuth();
  const [scriptData, setScriptData] = useState<TrackerScriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (isOpen && siteId) {
      fetchTrackerScript();
    }
  }, [isOpen, siteId]);

  const fetchTrackerScript = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/tracker-script`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracker script');
      }

      const data = await response.json();
      setScriptData(data);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to load tracker script', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyScript = async () => {
    if (!scriptData) return;
    
    try {
      await navigator.clipboard.writeText(scriptData.nextJsScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: 'Script copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy script', type: 'error' });
    }
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      title: "Dynamic Content Injection",
      description: "Automatically updates page titles, descriptions, keywords, and FAQ sections"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-green-500" />,
      title: "Performance Tracking",
      description: "Monitors page load times, Core Web Vitals, and user interactions"
    },
    {
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      title: "SEO Optimization",
      description: "Ensures content is visible to search engines and crawlers"
    },
    {
      icon: <Settings className="h-5 w-5 text-orange-500" />,
      title: "Easy Management",
      description: "Deploy and manage content changes from your dashboard"
    }
  ];

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Loading Tracker Script...</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Tracker Script for {siteName}</span>
            </DialogTitle>
            <DialogDescription>
              Copy and paste this script into your website to enable content optimization and analytics tracking.
            </DialogDescription>
          </DialogHeader>

          {scriptData && (
            <div className="space-y-6">
              {/* Features Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What This Script Does</CardTitle>
                  <CardDescription>
                    Our lightweight tracking script enables powerful SEO optimization features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        {feature.icon}
                        <div>
                          <h4 className="font-medium text-sm">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Script Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Tracking Script</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Site ID: {scriptData.trackerId.slice(0, 8)}...
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyScript}
                        className="flex items-center space-x-1"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    This script is unique to your site and includes your tracking ID
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code className="text-gray-800">{scriptData.nextJsScript}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Installation Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span>Installation Instructions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Copy the Script</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Click the "Copy Script" button above to copy the tracking code to your clipboard.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Paste in Your Website</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {scriptData.instructions.installation}
                        </p>
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <strong>Recommended:</strong> Place the script in the &lt;head&gt; section, 
                            preferably near the top for optimal performance.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Verify Installation</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {scriptData.instructions.verification}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-medium">Start Optimizing</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Once installed, you can deploy content changes from your dashboard and track performance in real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform-Specific Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform-Specific Installation</CardTitle>
                  <CardDescription>
                    Quick guides for popular website platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">WordPress</h4>
                      <p className="text-xs text-gray-600">
                        Go to Appearance → Theme Editor → header.php and paste the script before &lt;/head&gt;
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Shopify</h4>
                      <p className="text-xs text-gray-600">
                        Go to Online Store → Themes → Actions → Edit Code → theme.liquid and paste before &lt;/head&gt;
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Squarespace</h4>
                      <p className="text-xs text-gray-600">
                        Go to Settings → Advanced → Code Injection and paste in Header section
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Wix</h4>
                      <p className="text-xs text-gray-600">
                        Go to Settings → Custom Code → Add Custom Code and choose Head section
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span>Next Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-green-700">
                  <div className="space-y-2">
                    <p className="text-sm">After installing the script:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Deploy optimized content to specific pages</li>
                      <li>• Monitor performance and analytics</li>
                      <li>• Track SEO improvements in real-time</li>
                      <li>• Manage content updates from the dashboard</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={copyScript} disabled={!scriptData}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
} 