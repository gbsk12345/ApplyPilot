// src/components/dashboard/ApplyButton.tsx
'use client';

import { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext'; // Import the new hook
import { useAuth } from '@/contexts/AuthContext';     // Still needed for the auth token

interface ApplyButtonProps {
  jobUrl: string;
  jobTitle?: string;
  onApplySuccess?: () => void;
}

export default function ApplyButton({ jobUrl, jobTitle, onApplySuccess }: ApplyButtonProps) {
  // --- Consume data from our central contexts ---
  const { userProfile, educationHistory, isLoading: isProfileLoading } = useProfile();
  const { session } = useAuth();

  // --- Local state for the button's own process ---
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_AUTOAPPLY_API_URL;

  const handleApply = async () => {
    // --- Pre-flight checks ---
    if (!backendApiUrl) {
      setError('Auto-apply API URL is not configured.');
      return;
    }
    if (!session) {
      setError('You must be logged in to apply.');
      return;
    }
    if (isProfileLoading || !userProfile) {
      setError('Your profile data is still loading or not available. Please wait a moment.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsApplying(true);

    try {
      // --- Dynamically assemble userData from the context ---
      const latestEducation = educationHistory?.[0]; // Get the most recent education record

      const userData = {
        "First Name": userProfile.first_name || '',
        "Last Name": userProfile.last_name || '',
        "Email": userProfile.email || '',
        "Phone": userProfile.phone || '',
        "Location (City)": userProfile.city ? `${userProfile.city}, ${userProfile.state || ''}`.trim().replace(/,$/, '') : '',
        "School": latestEducation?.school_name || '',
        "Degree": latestEducation?.degree_level || '',
        "Discipline": latestEducation?.major || '',
        "Start date month": latestEducation?.start_date ? new Date(latestEducation.start_date).toLocaleString('default', { month: 'long' }) : '',
        "Start date year": latestEducation?.start_date ? new Date(latestEducation.start_date).getFullYear().toString() : '',
        "End date month": latestEducation?.graduation_date ? new Date(latestEducation.graduation_date).toLocaleString('default', { month: 'long' }) : '',
        "End date year": latestEducation?.graduation_date ? new Date(latestEducation.graduation_date).getFullYear().toString() : '',
        "LinkedIn Profile": userProfile.linkedin_url || '',
        "Website": userProfile.website_url || '',
        // These fields are often job-specific, so we provide sensible defaults or use profile data.
        "How did you hear about this job?": "Referral",
        "Are you over 18 years of age?": "Yes",
        "Do you have unlimited and unrestricted authorization to work in the United States?": userProfile.authorized_to_work ? "Yes" : "No",
        "Will you, now or in the future, require company assistance or sponsorship…?": userProfile.needs_sponsorship ? "Yes" : "No",
        "Do you currently, or in the past year, work for or with a dealer…?": "No",
        "Are you currently subject to any restrictive covenant…?": "No"
      };

      // --- Make the API call ---
      const response = await fetch(`${backendApiUrl}/api/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobUrl, userData }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.error || `Failed to apply (status ${response.status})`);
      }

      setSuccessMessage(`Successfully initiated application for: ${jobTitle || 'this job'}`);
      if (onApplySuccess) {
        onApplySuccess();
      }

    } catch (err: any) {
      console.error('Error during application process:', err);
      setError(err.message || 'An unexpected error occurred while trying to apply.');
    } finally {
      setIsApplying(false);
    }
  };

  const buttonDisabled = isApplying || isProfileLoading || !!successMessage;
  const getButtonText = () => {
    if (isProfileLoading) return 'Loading Profile...';
    if (isApplying) return 'Applying...';
    if (successMessage) return 'Applied!';
    return 'Auto-Apply';
  }

  return (
    <>
      <button
        onClick={handleApply}
        disabled={buttonDisabled}
        className={`w-full sm:w-auto font-semibold py-2.5 px-5 rounded-lg text-sm text-center transition-colors duration-150 whitespace-nowrap shadow-md hover:shadow-lg
                    ${buttonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                    ${successMessage ? 'bg-green-600 text-white' : ''}`}
      >
        {getButtonText()}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 text-center sm:text-left">{error}</p>}
    </>
  );
}
