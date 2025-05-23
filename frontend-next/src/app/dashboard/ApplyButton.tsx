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
    const userId = session.user.id;
    try {
      const response = await fetch(`${backendApiUrl}/api/apply`, { // Use the configured backend URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobUrl, userId }),
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
        disabled={isLoading || !!successMessage} // Disable if loading or already successful for this instance
        className={`w-full sm:w-auto font-semibold py-2.5 px-5 rounded-lg text-sm text-center transition-colors duration-150 whitespace-nowrap shadow-md hover:shadow-lg
                    ${isLoading ? 'bg-gray-500 cursor-not-allowed' : ''}
                    ${!isLoading && !successMessage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                    ${successMessage ? 'bg-green-600 text-white cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Applying...' : successMessage ? 'Applied!' : 'Auto-Apply'}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 text-center sm:text-left">{error}</p>}
      {/* You could clear successMessage after a few seconds if you want the button to be clickable again */}
    </>
  );
}