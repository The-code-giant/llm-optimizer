"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { CreditCard, Check, Zap, Crown, Star } from "lucide-react";
import Toast from "../../../components/Toast";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { changePlan, getActiveSubscription } from "@/lib/api";
import { format } from "date-fns";

interface BillingInfo {
  plan: string;
  nextBillingDate: string;
  isActive: boolean
  usage: {
    sitesAnalyzed: number;
    sitesLimit: number;
    pagesAnalyzed: number;
    pagesLimit: number;
  };
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out our LLM optimization tools",
    features: [
      "Up to 2 sites",
      "10 pages per month",
      "Basic SEO analysis",
      "Email support",
    ],
    icon: Star,
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "Ideal for small to medium websites",
    features: [
      "Up to 10 sites",
      "500 pages per month",
      "Advanced LLM optimization",
      "Priority support",
      "Custom reports",
    ],
    icon: Zap,
    current: false,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "per month",
    description: "For large websites and agencies",
    features: [
      "Unlimited sites",
      "5,000 pages per month",
      "White-label solution",
      "24/7 phone support",
      "API access",
      "Custom integrations",
    ],
    icon: Crown,
    current: false,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    async function fetchBilling() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          setError("Failed to get authentication token");
          return;
        }
        const subscription = await getActiveSubscription(token);

        // Mock data for now
        setBilling({
          plan: subscription.type,
          nextBillingDate: subscription.nextBilling ? format(
            new Date(subscription.nextBilling),
            "MMMM d, yyyy"
          ) : "N/A",
          isActive: subscription.isActive,
          usage: {
            sitesAnalyzed: 2,
            sitesLimit: 2,
            pagesAnalyzed: 8,
            pagesLimit: 10,
          },
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load billing info"
        );
        setToast({
          message: "Failed to load billing information",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBilling();
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  const handlePlanChange = async (planId: string) => {
    const token = await getToken();
    if (!token) {
      setError("Failed to get authentication token");
      return;
    }
    const subscription = await changePlan(token, planId);

    if (subscription.redirectUrl) {
      window.location.href = subscription.redirectUrl;
      return;
    }

    if (subscription.isUpgrade) {
      setToast({
        message: "Upgrade successful",
        type: "success",
      });
      return;
    }
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
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Billing & Subscription
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Manage your subscription plan and billing information.
                    </p>
                  </div>

                  {/* Current Plan & Usage */}
                  {loading ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : billing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Current Plan
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold capitalize">
                                {billing.plan} Plan
                              </span>
                              <Badge variant="outline">{billing.isActive ? "Active" : "Not Active"}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {/* <p>Payment Method: {billing.paymentMethod}</p> */}
                              <p>Next Billing: {billing.nextBillingDate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Usage This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Sites Analyzed</span>
                                <span>
                                  {billing.usage.sitesAnalyzed}/
                                  {billing.usage.sitesLimit}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (billing.usage.sitesAnalyzed /
                                        billing.usage.sitesLimit) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Pages Analyzed</span>
                                <span>
                                  {billing.usage.pagesAnalyzed}/
                                  {billing.usage.pagesLimit}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (billing.usage.pagesAnalyzed /
                                        billing.usage.pagesLimit) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}

                  {/* Available Plans */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Choose Your Plan</CardTitle>
                      <CardDescription>
                        Upgrade or downgrade your plan anytime. No commitments.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                          const Icon = plan.icon;
                          return (
                            <Card
                              key={plan.name}
                              className={`relative ${
                                plan.popular ? "border-primary border-2" : ""
                              } ${plan.current ? "bg-muted/50" : ""}`}
                            >
                              {plan.popular && (
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-primary text-primary-foreground">
                                    Most Popular
                                  </Badge>
                                </div>
                              )}
                              <CardContent className="p-6">
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">
                                    {plan.name}
                                  </h3>
                                  <div className="text-3xl font-bold mb-1">
                                    {plan.price}
                                    <span className="text-sm text-muted-foreground font-normal">
                                      /{plan.period}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {plan.description}
                                  </p>

                                  <ul className="text-sm space-y-2 mb-6">
                                    {plan.features.map((feature, index) => (
                                      <li
                                        key={index}
                                        className="flex items-center"
                                      >
                                        <Check className="w-4 h-4 text-green-500 mr-2" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>

                                  <Button
                                    className="w-full"
                                    variant={
                                      plan.current ? "outline" : "default"
                                    }
                                    disabled={plan.current}
                                    onClick={() => {
                                      handlePlanChange(plan.id);
                                    }}
                                  >
                                    {plan.current
                                      ? "Current Plan"
                                      : "Choose Plan"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
