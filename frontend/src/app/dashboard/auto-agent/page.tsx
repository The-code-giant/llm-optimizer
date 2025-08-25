"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ArrowLeft, Sparkles, Zap, Brain, Rocket, Clock, Code, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AutoAgentPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Automation",
      description: "Intelligent workflows that adapt to your business needs"
    },
    {
      icon: Zap,
      title: "Smart Task Management",
      description: "Automated task prioritization and resource allocation"
    },
    {
      icon: Rocket,
      title: "Performance Optimization",
      description: "Continuous learning and improvement algorithms"
    },
    {
      icon: Code,
      title: "Custom Integrations",
      description: "Seamless connection with your existing tools"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SiteHeader />
              
              <div className="px-4 lg:px-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-start gap-3">
                      <Link href="/dashboard">
                        <Button variant="ghost" className="p-2">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-xl md:text-2xl font-semibold">Auto Agent</h1>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white animate-pulse">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Coming Soon
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Under active development</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Coming Soon Message */}
                    <div className="space-y-6">
                      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-primary/5">
                        <CardHeader className="text-center">
                          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <Rocket className="w-12 h-12 text-white" />
                          </div>
                          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                            Auto Agent Dashboard
                          </CardTitle>
                          <CardDescription className="text-lg">
                            The future of intelligent automation is almost here
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                          <p className="text-muted-foreground">
                            We're building something amazing that will revolutionize how you manage your SEO automation. 
                            Get ready for AI-powered workflows, smart task management, and intelligent optimization.
                          </p>
                          
                          {/* Animated Progress Bar */}
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full animate-pulse" 
                                 style={{ width: '75%' }}></div>
                          </div>
                          <p className="text-sm text-muted-foreground">75% Complete</p>
                          
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Feature Preview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            What's Coming
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {features.map((feature, index) => (
                              <div 
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                                  currentFeature === index 
                                    ? 'bg-primary/10 border border-primary/20 scale-105' 
                                    : 'bg-muted/50'
                                }`}
                              >
                                <div className={`p-2 rounded-lg transition-all duration-300 ${
                                  currentFeature === index 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <feature.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{feature.title}</h4>
                                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column - Interactive Elements */}
                    <div className="space-y-6">
                      {/* Status Card */}
                      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Code className="h-5 w-5" />
                            Development Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Backend API</span>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Complete
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">AI Models</span>
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Training
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Frontend UI</span>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                In Progress
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Testing</span>
                              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                                Pending
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notification Signup */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Get Notified</CardTitle>
                          <CardDescription>
                            Be the first to know when Auto Agent launches
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder="Enter your email"
                              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
                              Notify Me
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            We'll send you an email when Auto Agent is ready. No spam, ever.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Quick Actions */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/dashboard">
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Back to Dashboard
                            </Link>
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Request Features
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Code className="h-4 w-4 mr-2" />
                            View Roadmap
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
