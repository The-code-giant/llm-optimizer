"use client";

import { ReactElement, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Building, Mail, Phone, Globe, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitEarlyAccessApplication } from "@/lib/api";
// Form validation schema
const applicationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  companyWebsite: z
    .string()
    .min(1, "Company website is required")
    .trim()
    .toLowerCase()
    .refine((url) => {
      // Auto-prepend https:// if no protocol is provided
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return true; // We'll handle this in transform
      }
      return true;
    })
    .transform((url) => {
      // Auto-prepend https:// if no protocol is provided
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
      }
      return url;
    })
    .refine((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
      } catch {
        return false;
      }
    }, "Please enter a valid website URL")
    .refine((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.length > 0 && urlObj.hostname.includes(".");
      } catch {
        return false;
      }
    }, "Please enter a valid domain name"),
  companyEmail: z
    .string()
    .min(1, "Company email is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone || phone.trim() === "") return true;
      // Basic phone number validation (allows various formats)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");
      return phoneRegex.test(cleanPhone);
    }, "Please enter a valid phone number"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationModalProps {
  onSuccess?: () => void;
  button?: ReactElement;
}

export default function ApplicationModal({
  onSuccess,
  button,
}: ApplicationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // TODO: Replace with actual API call
      console.log("Early Access Application:", data);

      // Simulate API call
      const result = await submitEarlyAccessApplication(data);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      if (result.success) {
        reset();
        setShowSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to submit application:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog modal >
      <DialogTrigger className="w-full md:w-fit">
        {button ? (
          button
        ) : (
          <>
            <div  className="!w-full cursor-pointer transform rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:py-2 sm:text-base md:text-lg"
            >
              Join Our Early Access Program
            </div>
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] bg-white overflow-y-scroll md:overflow-y-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Early Access Application
            </DialogTitle>
            <DialogDescription>
              Apply for early access to our LLM optimization platform. We'll
              review your application and get back to you soon.
            </DialogDescription>
          </DialogHeader>

       {showSuccess && (
         <div className="flex flex-col items-center justify-center py-8 px-4">
           <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
             <CheckCircle className="w-8 h-8 text-green-600" />
           </div>
           <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
             Welcome to Early Access!
           </h3>
           <p className="text-gray-600 text-center mb-6 max-w-md">
             Congratulations! You have successfully joined our early access program. 
             We'll be in touch soon with next steps and exclusive updates.
           </p>
           <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-md">
             <div className="flex items-center gap-2">
               <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
               <p className="text-sm text-green-800">
                 Application submitted successfully
               </p>
             </div>
           </div>
         </div>
       )}

       {!showSuccess && (
           <div className="grid gap-4 py-4">
           {submitError && (
             <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
               <Mail className="w-4 h-4 text-destructive mt-0.5" />
               <p className="text-sm text-destructive">{submitError}</p>
             </div>
           )}

           {/* First Name */}
           <div className="grid gap-2">
             <Label htmlFor="firstName" className="flex items-center gap-2">
               <User className="h-4 w-4" />
               First Name *
             </Label>
             <Input
               id="firstName"
               type="text"
               placeholder="John"
               {...register("firstName")}
               disabled={isSubmitting}
               className={errors.firstName ? "border-red-500" : ""}
             />
             {errors.firstName && (
               <p className="text-sm text-red-500">
                 {errors.firstName.message}
               </p>
             )}
           </div>

           {/* Last Name */}
           <div className="grid gap-2">
             <Label htmlFor="lastName" className="flex items-center gap-2">
               <User className="h-4 w-4" />
               Last Name *
             </Label>
             <Input
               id="lastName"
               type="text"
               placeholder="Doe"
               {...register("lastName")}
               disabled={isSubmitting}
               className={errors.lastName ? "border-red-500" : ""}
             />
             {errors.lastName && (
               <p className="text-sm text-red-500">
                 {errors.lastName.message}
               </p>
             )}
           </div>

           {/* Company Website */}
           <div className="grid gap-2">
             <Label
               htmlFor="companyWebsite"
               className="flex items-center gap-2"
             >
               <Globe className="h-4 w-4" />
               Company Website *
             </Label>
             <Input
               id="companyWebsite"
               type="text"
               placeholder="example.com"
               {...register("companyWebsite")}
               disabled={isSubmitting}
               className={errors.companyWebsite ? "border-red-500" : ""}
             />
             {errors.companyWebsite && (
               <p className="text-sm text-red-500">
                 {errors.companyWebsite.message}
               </p>
             )}
           </div>

           {/* Company Email */}
           <div className="grid gap-2">
             <Label htmlFor="companyEmail" className="flex items-center gap-2">
               <Mail className="h-4 w-4" />
               Company Email *
             </Label>
             <Input
               id="companyEmail"
               type="email"
               placeholder="john@company.com"
               {...register("companyEmail")}
               disabled={isSubmitting}
               className={errors.companyEmail ? "border-red-500" : ""}
             />
             {errors.companyEmail && (
               <p className="text-sm text-red-500">
                 {errors.companyEmail.message}
               </p>
             )}
           </div>

           {/* Phone Number (Optional) */}
           <div className="grid gap-2">
             <Label htmlFor="phoneNumber" className="flex items-center gap-2">
               <Phone className="h-4 w-4" />
               Phone Number
               <span className="text-muted-foreground text-xs">
                 (optional)
               </span>
             </Label>
             <Input
               id="phoneNumber"
               type="tel"
               placeholder="+1 (555) 123-4567"
               {...register("phoneNumber")}
               disabled={isSubmitting}
               className={errors.phoneNumber ? "border-red-500" : ""}
             />
             {errors.phoneNumber && (
               <p className="text-sm text-red-500">
                 {errors.phoneNumber.message}
               </p>
             )}
           </div>
         </div>
       )}

          {!showSuccess && (
            <DialogFooter className="w-full !flex-row my-2 flex !items-center !justify-center">
              <Button type="submit" disabled={isSubmitting} className="text-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
