'use client';

import { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth }    from '@/contexts/AuthContext';

interface ApplyButtonProps {
  jobUrl: string;
  jobTitle?: string;
  onApplySuccess?: () => void;
}

// ────────────────────────────────────────────────────────────
// tiny helpers
const month = (d?: string|null) => d ? new Date(d).toLocaleString('default',{month:'long'}) : '';
const year  = (d?: string|null) => d ? new Date(d).getFullYear().toString() : '';
const normalizeArray = (arr: any) => Array.isArray(arr) ? arr : [];
// ────────────────────────────────────────────────────────────

export default function ApplyButton({ jobUrl, jobTitle, onApplySuccess }: ApplyButtonProps) {
  /* context data */
  const { userProfile, educationHistory, workExperiences, isLoading: isProfileLoading } = useProfile();
  const { session } = useAuth();

  /* local UI state */
  const [isApplying, setIsApplying]   = useState(false);
  const [error,       setError]       = useState<string|null>(null);
  const [successMessage, setSuccessMessage] = useState<string|null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_AUTOAPPLY_API_URL;

  const handleApply = async () => {
    /* guards */
    if (!backendApiUrl)            return setError('Auto-apply API URL is not configured.');
    if (!session)                  return setError('You must be logged in to apply.');
    if (isProfileLoading)          return setError('Profile data is still loading. Please wait.');
    if (!userProfile)              return setError('Profile data not available.');

    setError(null); setSuccessMessage(null); setIsApplying(true);

    try {
      /* ------------- build userData ------------- */
      const latestEd = educationHistory?.[0];

      const baseData = {
        'First Name' : userProfile.first_name ?? '',
        'Last Name'  : userProfile.last_name  ?? '',
        'Email'      : userProfile.email      ?? '',
        'Phone'      : userProfile.phone      ?? '',
        'Location (City)': userProfile.city
              ? `${userProfile.city}, ${userProfile.state ?? ''}`.trim().replace(/,$/, '')
              : '',
        'LinkedIn Profile' : userProfile.linkedin_url  ?? '',
        'Website'          : userProfile.website_url   ?? '',
        'Gender'           : userProfile.gender        ?? '',
        'Race'             : userProfile.race          ?? '',
        'Veteran Status'   : userProfile.veteran_status?? '',
        'Disability Status': userProfile.disability_status ?? '',
        /* sensible defaults */
        'How did you hear about this job?'                                          : 'Referral',
        'Are you over 18 years of age?'                                             : 'Yes',
        'Do you have unlimited and unrestricted authorization to work in the United States?':
            userProfile.authorized_to_work ? 'Yes' : 'No',
        'Will you, now or in the future, require company assistance or sponsorship…?':
            userProfile.needs_sponsorship  ? 'Yes' : 'No',
        'Do you currently, or in the past year, work for or with a dealer…?'        : 'No',
        'Are you currently subject to any restrictive covenant…?'                  : 'No'
      };

      /* ---- all education rows ---- */
      const educations = normalizeArray(educationHistory).map(ed => ({
        school_name : ed.school_name     ?? '',
        degree_level: ed.degree_level    ?? '',
        major       : ed.major           ?? '',
        start_month : month(ed.start_date),
        start_year  : year (ed.start_date),
        end_month   : month(ed.graduation_date),
        end_year    : year (ed.graduation_date)
      }));

      /* ---- all experience rows ---- */
      const experiences = normalizeArray(workExperiences).map(ex => ({
        job_title        : ex.job_title        ?? '',
        company_name     : ex.company_name     ?? '',
        company_location : ex.company_location ?? '',
        start_month      : month(ex.start_date),
        start_year       : year (ex.start_date),
        end_month        : month(ex.end_date),
        end_year         : year (ex.end_date),
        current_job      : !!ex.current_job,
        job_description  : ex.job_description  ?? ''
      }));

      const userData = { ...baseData, educations, experiences };
      /* -------------------------------------------- */
      console.log('🚀 Sending userData ===>', userData);
      const response = await fetch(`${backendApiUrl}/api/apply`, {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ jobUrl, userData })
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || `Apply failed (${response.status})`);

      setSuccessMessage(`Successfully initiated application for ${jobTitle || 'this job'}`);
      onApplySuccess?.();

    } catch (err:any) {
      console.error(err);
      setError(err.message || 'Unexpected error during auto-apply.');
    } finally {
      setIsApplying(false);
    }
  };

  /* rendering */
  const disabled = isApplying || isProfileLoading || !!successMessage;
  const text = isProfileLoading ? 'Loading Profile…'
              : isApplying     ? 'Applying…'
              : successMessage ? 'Applied!' : 'Auto-Apply';

  return (
    <>
      <button
        onClick={handleApply}
        disabled={disabled}
        className={`w-full sm:w-auto py-2.5 px-5 rounded-lg font-semibold text-sm shadow-md transition
          ${disabled ? 'bg-gray-500 cursor-not-allowed'
                     : 'bg-purple-600 hover:bg-purple-700 text-white'}
          ${successMessage ? 'bg-green-600' : ''}`}
      >
        {text}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 text-center sm:text-left">{error}</p>}
    </>
  );
}
