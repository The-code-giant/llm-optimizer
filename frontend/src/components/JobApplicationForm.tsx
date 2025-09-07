'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Zod schema for form validation
const jobApplicationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  position: z.string().min(1, 'Please select a position'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  resume: z.any().refine(
    (files) => files && files.length > 0,
    'Please upload your resume'
  ).refine(
    (files) => files[0]?.size <= 10 * 1024 * 1024,
    'File size must be less than 10MB'
  ).refine(
    (files) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(files[0]?.type),
    'Only PDF, DOC, and DOCX files are allowed'
  )
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobPosition {
  title: string;
  department: string;
}

interface JobApplicationFormProps {
  positions: JobPosition[];
}

export default function JobApplicationForm({ positions }: JobApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema)
  });

  const onSubmit = async (data: JobApplicationFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('position', data.position);
      formData.append('coverLetter', data.coverLetter);
      formData.append('resume', data.resume[0]);

      const response = await fetch('/api/job-application', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      setSubmitStatus('success');
      reset();
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFile = watch('resume');

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="bg-gray-50 rounded-xl p-8"
    >
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">Application Submitted Successfully!</h3>
            <p className="text-green-700 text-sm">Thank you for your interest. We'll review your application and get back to you soon.</p>
          </div>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Submission Failed</h3>
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              id="firstName"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              id="lastName"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
            Position of Interest *
          </label>
          <select
            {...register('position')}
            id="position"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.position ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a position</option>
            {positions.map((position, index) => (
              <option key={index} value={position.title}>
                {position.title} - {position.department}
              </option>
            ))}
            <option value="other">Other (specify in cover letter)</option>
          </select>
          {errors.position && (
            <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <textarea
            {...register('coverLetter')}
            id="coverLetter"
            rows={6}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.coverLetter ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell us why you're excited about joining our team and how you can contribute to our mission..."
          />
          {errors.coverLetter && (
            <p className="mt-1 text-sm text-red-600">{errors.coverLetter.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
            Resume/CV *
          </label>
          <input
            {...register('resume')}
            type="file"
            id="resume"
            accept=".pdf,.doc,.docx"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
              errors.resume ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {selectedFile && selectedFile.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile[0].name} ({(selectedFile[0].size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {errors.resume && (
            <p className="mt-1 text-sm text-red-600">{errors.resume.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Accepted formats: PDF, DOC, DOCX (Max 10MB)
          </p>
        </div>

        <div className="text-center">
          <Button 
            type="submit"
            size="lg" 
            disabled={isSubmitting}
            className="bg-black text-white hover:bg-gray-800 rounded-lg px-8 py-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
