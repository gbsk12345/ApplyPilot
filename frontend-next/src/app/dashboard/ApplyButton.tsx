// src/components/dashboard/ApplyButton.tsx
'use client';

import { use, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ApplyButtonProps {
  jobUrl: string;
  jobTitle?: string;
  onApplySuccess?: () => void;
}

export default function ApplyButton({ jobUrl, jobTitle, onApplySuccess }: ApplyButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_AUTOAPPLY_API_URL;
  const handleApply = async () => {
    if (!backendApiUrl) {
      setError('Auto-apply API URL is not configured.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError('You need to be logged in to apply.');
      setIsLoading(false);
      return;
    }
    const userData = {
        "First Name": "Aditya",
        "Last Name": "Jadhav",
        "Email": "aditya@example.com",
        "Phone": "+911234567890",
        "Location (City)": "Tucson, Arizona",
        "School": "University of Arizona",
        "Degree": "Bachelors Degree",
        "Discipline": "Computer Science",
        "Start date month": "August",
        "Start date year": "2021",
        "End date month": "May",
        "End date year": "2025",
        "LinkedIn Profile": "https://linkedin.com/in/aditya",
        "Website": "https://aditya.dev",
        "How did you hear about this job?": "Referral",
        "Are you over 18 years of age?": "Yes",
        "Do you have unlimited and unrestricted authorization to work in the United States?": "Yes",
        "Will you, now or in the future, require company assistance or sponsorship…?": "No",
        "Do you currently, or in the past year, work for or with a dealer…?": "No",
        "Are you currently subject to any restrictive covenant…?": "No"
      };

      /*
      // --- FUTURE DATABASE CALL IMPLEMENTATION ---
      // When you are ready, you can remove the hardcoded object above
      // and uncomment this section to fetch the data live from Supabase.
      
      const { data: userDataFromDB, error: profileError } = await supabase
        .from('profiles') // IMPORTANT: Replace 'profiles' with your actual table name
        .select('*')      // Or specify the exact columns you need
        .eq('id', userId)
        .single();

      if (profileError || !userDataFromDB) {
        throw new Error(profileError?.message || 'Could not find your profile data to apply.');
      }
      
      // You would then use `userDataFromDB` in the fetch call's body below.
      */
    try {
      const response = await fetch(`${backendApiUrl}/api/apply`, { // Use the configured backend URL
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

      setSuccessMessage(`Successfully initiated application for: ${jobTitle || jobUrl}`);
      if (onApplySuccess) {
        onApplySuccess();
      }

    } catch (err: any) {
      console.error('Error during application process:', err);
      setError(err.message || 'An unexpected error occurred while trying to apply.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleApply}
        disabled={isLoading || !!successMessage}
        className={`w-full sm:w-auto font-semibold py-2.5 px-5 rounded-lg text-sm text-center transition-colors duration-150 whitespace-nowrap shadow-md hover:shadow-lg
                    ${isLoading ? 'bg-gray-500 cursor-not-allowed' : ''}
                    ${!isLoading && !successMessage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                    ${successMessage ? 'bg-green-600 text-white cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Applying...' : successMessage ? 'Applied!' : 'Auto-Apply'}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 text-center sm:text-left">{error}</p>}
      {}
    </>
  );
}