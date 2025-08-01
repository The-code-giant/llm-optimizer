"use client";
import { SignUp, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const websiteUrl = searchParams.get('website');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is already signed in, redirect to dashboard with website URL if available
      const redirectUrl = websiteUrl 
        ? `/dashboard?website=${encodeURIComponent(websiteUrl)}`
        : "/dashboard";
      router.replace(redirectUrl);
    }
  }, [isLoaded, isSignedIn, router, websiteUrl]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">You&apos;re already signed in. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
                        <p className="text-gray-600 mt-2">Create your Clever Search account</p>
        </div>
        <SignUp 
          path="/register" 
          routing="path" 
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border-0",
            },
          }}
        />
      </div>
    </div>
  );
}
