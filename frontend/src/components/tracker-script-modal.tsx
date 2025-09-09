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
  Zap,
  Play,
  Monitor,
  ShoppingCart,
  Palette
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
// Removed Select imports

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
  nextJsScript: string;
  scriptHtml: string;
  platform: string;
  config: {
    API_BASE: string;
    SITE_ID: string;
  };
  instructions: {
    nextjs: string;
    react: string;
    wordpress: string;
    shopify: string;
    wix: string;
    squarespace: string;
    other: string;
  };
}

type Platform = 'nextjs' | 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'other';

const platforms = [
  {
    id: 'nextjs' as Platform,
    name: 'Next.js',
    icon: <Code className="h-4 w-4" />,
    description: 'React framework with built-in optimizations'
  },
  {
    id: 'wordpress' as Platform,
    name: 'WordPress',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Popular CMS platform'
  },
  {
    id: 'shopify' as Platform,
    name: 'Shopify',
    icon: <ShoppingCart className="h-4 w-4" />,
    description: 'E-commerce platform'
  },
  {
    id: 'wix' as Platform,
    name: 'Wix',
    icon: <Palette className="h-4 w-4" />,
    description: 'Website builder platform'
  },
  {
    id: 'squarespace' as Platform,
    name: 'Squarespace',
    icon: <Globe className="h-4 w-4" />,
    description: 'Website and e-commerce platform'
  },
  {
    id: 'other' as Platform,
    name: 'Other',
    icon: <Settings className="h-4 w-4" />,
    description: 'Custom or other platforms'
  }
];

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
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('nextjs');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // fetchTrackerScript is stable and defined inline, safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && siteId) {
      fetchTrackerScript();
    }
  }, [isOpen, siteId, selectedPlatform]);

  const fetchTrackerScript = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/sites/${siteId}/tracker-script?platform=${selectedPlatform}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracker script');
      }

      const data = await response.json();
      
      // Extract data from the response structure { success: true, data: {...}, message: "..." }
      if (data && data.success && data.data) {
        setScriptData(data.data);
      } else {
        // Fallback for direct response format (if any legacy endpoints still exist)
        setScriptData(data);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tracker script';
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyScript = async () => {
    if (!scriptData) return;
    const scriptToCopy = selectedPlatform === 'nextjs' ? scriptData.nextJsScript : scriptData.scriptHtml;
    try {
      await navigator.clipboard.writeText(scriptToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: 'Script copied to clipboard!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy script', type: 'error' });
    }
  };

  const getCurrentScript = () => {
    if (!scriptData) return '';
    return selectedPlatform === 'nextjs' ? scriptData.nextJsScript : scriptData.scriptHtml;
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
              Select your platform and copy the appropriate script to enable content optimization and analytics tracking.
            </DialogDescription>
          </DialogHeader>

          {/* What This Script Does - moved to top */}
          <Card className="mb-6">
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

          {/* Platform Button Group */}
          <div className="flex flex-wrap gap-2 mb-6">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? "default" : "outline"}
                className={`flex items-center space-x-2${selectedPlatform === platform.id ? ' ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPlatform(platform.id)}
              >
                {platform.icon}
                <span>{platform.name}</span>
              </Button>
            ))}
          </div>

          {scriptData && (
            <div className="space-y-6">
              {/* Script Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Tracking Script</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {platforms.find(p => p.id === selectedPlatform)?.name}
                      </Badge>
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
                    This script is optimized for {platforms.find(p => p.id === selectedPlatform)?.name} and includes your tracking ID
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border max-h-48 overflow-y-auto">
                      <code className="text-gray-800 whitespace-pre-wrap break-all">{getCurrentScript()}</code>
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
                          Click the &quot;Copy Script&quot; button above to copy the tracking code to your clipboard.
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
                          {scriptData.instructions[selectedPlatform as keyof typeof scriptData.instructions] || scriptData.instructions.other}
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
                          After adding the script, visit your website and check the browser&apos;s developer console for &quot;Cleversearch tracker loaded&quot; message to confirm it&apos;s working.
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

              {/* Video Tutorial Placeholder - moved to bottom */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-red-500" />
                    <span>Installation Tutorial</span>
                  </CardTitle>
                  <CardDescription>
                    Watch our step-by-step video guide for {platforms.find(p => p.id === selectedPlatform)?.name} installation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium text-sm">Video Tutorial Coming Soon</p>
                      <p className="text-xs text-gray-400 mt-1">
                        We&apos;re creating detailed installation guides for each platform
                      </p>
                    </div>
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