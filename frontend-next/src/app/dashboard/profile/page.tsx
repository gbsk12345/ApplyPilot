'use client';
// Now client side
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; // Use client-side Supabase
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have AuthContext setup
import type { User } from '@supabase/supabase-js';

// --- Interfaces (can be moved to a types file) ---
interface UserProfile {
  user_id: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null; // This might come from auth.user primarily
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  authorized_to_work?: boolean | null;
  needs_sponsorship?: boolean | null;
  visa_status?: string | null;
  desired_salary?: string | null;
  willing_to_relocate?: boolean | null;
  interest_statement?: string | null;
  additional_info?: string | null;
  gender?: string | null;
  race?: string | null;
  veteran_status?: string | null;
  disability_status?: string | null;
}

interface Education {
  id: number;
  user_id: string;
  school_name?: string | null;
  degree_level?: string | null;
  major?: string | null;
  start_date?: string | null;
  graduation_date?: string | null;
}

interface WorkExperience {
  id: number;
  user_id: string;
  job_title?: string | null;
  company_name?: string | null;
  company_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current_job?: boolean | null;
  job_description?: string | null;
}

interface CachedData<T> {
  timestamp: number;
  data: T;
}

// --- Helper Components & Functions (can be moved to utils) ---
const ProfileFieldDisplay = ({ label, value }: { label: string; value?: React.ReactNode | null }) => {
  if (value === null || typeof value === 'undefined' || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  let displayValue: React.ReactNode = value;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  }
  return (
    <div className="mb-3 break-words">
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-100">{displayValue}</dd>
    </div>
  );
};

const formatDate = (dateStr: string | null | undefined, includeDay: boolean = false) => {
  if (!dateStr) return 'Present';
  try {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    if (includeDay) options.day = 'numeric';
    return new Date(dateStr).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return dateStr;
  }
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for example

// --- Main Page Component ---
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [educationHistory, setEducationHistory] = useState<Education[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadProfileData = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setFetchError(null);

    const profileKey = `userProfile-${currentUser.id}`;
    const educationKey = `educationHistory-${currentUser.id}`;
    const workExpKey = `workExperiences-${currentUser.id}`;

    // Attempt to load from localStorage
    try {
      const cachedProfileRaw = localStorage.getItem(profileKey);
      const cachedEducationRaw = localStorage.getItem(educationKey);
      const cachedWorkExpRaw = localStorage.getItem(workExpKey);

      let profileFromCache = false, eduFromCache = false, workFromCache = false;

      if (cachedProfileRaw) {
        const cache: CachedData<UserProfile> = JSON.parse(cachedProfileRaw);
        if (Date.now() - cache.timestamp < CACHE_DURATION_MS) {
          setUserProfile(cache.data);
          profileFromCache = true;
        }
      }
      if (cachedEducationRaw) {
        const cache: CachedData<Education[]> = JSON.parse(cachedEducationRaw);
        if (Date.now() - cache.timestamp < CACHE_DURATION_MS) {
          setEducationHistory(cache.data);
          eduFromCache = true;
        }
      }
      if (cachedWorkExpRaw) {
        const cache: CachedData<WorkExperience[]> = JSON.parse(cachedWorkExpRaw);
        if (Date.now() - cache.timestamp < CACHE_DURATION_MS) {
          setWorkExperiences(cache.data);
          workFromCache = true;
        }
      }
      // If all data is fresh from cache, we might consider not showing loader or stopping early
      // For now, we'll always fetch fresh in background to update.
      if (profileFromCache && eduFromCache && workFromCache) {
        // console.log("All profile data loaded from fresh localStorage cache.");
        // setIsLoading(false); // Optionally stop loading if all fresh from cache
      }
    } catch (e) {
      console.error("Error reading profile data from localStorage", e);
      // Clear potentially corrupted items
      localStorage.removeItem(profileKey);
      localStorage.removeItem(educationKey);
      localStorage.removeItem(workExpKey);
    }

    // Fetch fresh data from Supabase
    try {
      const [profileResult, educationResult, workExperienceResult] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', currentUser.id).single<UserProfile>(),
        supabase.from('education').select('*').eq('user_id', currentUser.id).order('graduation_date', { ascending: false }).returns<Education[]>(),
        supabase.from('work_experience').select('*').eq('user_id', currentUser.id).order('end_date', { ascending: false, nullsFirst: false }).order('start_date', { ascending: false }).returns<WorkExperience[]>()
      ]);

      if (profileResult.error && profileResult.error.code !== 'PGRST116') { // PGRST116: single row not found
        throw new Error(`Profile fetch: ${profileResult.error.message}`);
      }
      if (educationResult.error) throw new Error(`Education fetch: ${educationResult.error.message}`);
      if (workExperienceResult.error) throw new Error(`Work Experience fetch: ${workExperienceResult.error.message}`);
      
      const fetchedProfile = profileResult.data;
      const fetchedEducation = educationResult.data || [];
      const fetchedWorkExp = workExperienceResult.data || [];

      if (!fetchedProfile) {
        // User exists from auth, but no profile - might be an onboarding issue not caught by layout
        // For now, we'll just show empty, but you might redirect or show a specific message
        console.warn(`ProfilePage: No profile data found for user ${currentUser.id}, though user is authenticated.`);
        setUserProfile(null); // Or some default empty profile structure
        // Potentially redirect to onboarding if layout didn't catch it:
        // import { useRouter } from 'next/navigation'; const router = useRouter(); router.replace('/onboarding');
      } else {
        setUserProfile(fetchedProfile);
        localStorage.setItem(profileKey, JSON.stringify({ timestamp: Date.now(), data: fetchedProfile }));
      }

      setEducationHistory(fetchedEducation);
      localStorage.setItem(educationKey, JSON.stringify({ timestamp: Date.now(), data: fetchedEducation }));
      
      setWorkExperiences(fetchedWorkExp);
      localStorage.setItem(workExpKey, JSON.stringify({ timestamp: Date.now(), data: fetchedWorkExp }));

    } catch (error: any) {
      console.error("Error loading profile page data:", error);
      setFetchError(error.message || "Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (user) {
      loadProfileData(user);
    } else {
      // No user, clear data and stop loading (should be redirected by layout typically)
      setUserProfile(null);
      setEducationHistory([]);
      setWorkExperiences([]);
      setIsLoading(false);
      setFetchError("Please log in to view your profile.");
    }
  }, [user, authLoading, loadProfileData]);

  // This effect handles re-fetching data if the user navigates back to this page
  // and the data might have been updated (e.g., after an edit).
  // It checks if the revalidateProfile flag is set in sessionStorage.
  useEffect(() => {
    const revalidateFlag = sessionStorage.getItem(`revalidateProfile-${user?.id}`);
    if (revalidateFlag === 'true' && user) {
      sessionStorage.removeItem(`revalidateProfile-${user?.id}`); // Clear the flag
      loadProfileData(user); // Force re-fetch
    }
  }, [user, loadProfileData]);


  if (isLoading) {
    return (
      <div className="space-y-10 text-gray-100 animate-pulse">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="h-9 bg-gray-600/50 rounded w-1/3"></div>
          <div className="h-10 bg-gray-600/50 rounded w-32"></div>
        </div>
        {[1,2,3,4,5].map(i => (
             <div key={i} className="p-6 bg-gray-700/30 rounded-lg shadow-lg">
                <div className="h-7 bg-gray-600/50 rounded w-1/2 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="h-12 bg-gray-600/50 rounded"></div>
                    <div className="h-12 bg-gray-600/50 rounded"></div>
                </div>
             </div>
        ))}
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-red-400 bg-red-900/30 p-3 rounded-md">{fetchError}</p>;
  }
  
  // Redirect to onboarding if profile is still null after loading and no error (should be caught by layout typically)
  // This check might be redundant if your DashboardLayout already handles it robustly.
  if (!userProfile && !authLoading && user) { 
    // import { useRouter } from 'next/navigation'; const router = useRouter(); router.replace('/onboarding');
    return <p className="text-yellow-400">Profile not found. Redirecting to onboarding...</p>;
  }
  
  if (!userProfile) { // If still no userProfile (e.g. after logout or error before redirect)
    return <p className="text-gray-400">Please log in to view your profile.</p>;
  }
  
  const fullName = [userProfile.first_name, userProfile.middle_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.preferred_name || 'User';

  return (
    <div className="space-y-10 text-gray-100">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Link href="/dashboard/profile/edit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 whitespace-nowrap">
          Edit Profile
        </Link>
      </div>

      {/* Section 1: Personal Information */}
      <section id="personal-information" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Personal Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ProfileFieldDisplay label="Full Name" value={fullName} />
          {userProfile.preferred_name && <ProfileFieldDisplay label="Preferred Name" value={userProfile.preferred_name} />}
          <ProfileFieldDisplay label="Email" value={userProfile.email || user?.email} />
          <ProfileFieldDisplay label="Phone" value={userProfile.phone} />
          <ProfileFieldDisplay label="Address Line 1" value={userProfile.address_line1} />
          <ProfileFieldDisplay label="Address Line 2" value={userProfile.address_line2} />
          <ProfileFieldDisplay label="City" value={userProfile.city} />
          <ProfileFieldDisplay label="State/Province" value={userProfile.state} />
          <ProfileFieldDisplay label="Postal Code" value={userProfile.postal_code} />
          <ProfileFieldDisplay label="Country" value={userProfile.country} />
        </dl>
      </section>

      {/* Section 2: Online Presence */}
      <section id="online-presence" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Online Presence</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ProfileFieldDisplay label="LinkedIn Profile" value={userProfile.linkedin_url ? <Link href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">{userProfile.linkedin_url}</Link> : null} />
          <ProfileFieldDisplay label="Personal Website/Portfolio" value={userProfile.website_url ? <Link href={userProfile.website_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">{userProfile.website_url}</Link> : null} />
          <ProfileFieldDisplay label="GitHub Profile" value={userProfile.github_url ? <Link href={userProfile.github_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">{userProfile.github_url}</Link> : null} />
        </dl>
      </section>

      {/* Section 3: Work Preferences & Authorization */}
      <section id="work-preferences" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Work Preferences & Authorization</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ProfileFieldDisplay label="Authorized to Work" value={userProfile.authorized_to_work} />
          <ProfileFieldDisplay label="Needs Sponsorship" value={userProfile.needs_sponsorship} />
          <ProfileFieldDisplay label="Visa Status" value={userProfile.visa_status} />
          <ProfileFieldDisplay label="Desired Salary" value={userProfile.desired_salary} />
          <ProfileFieldDisplay label="Willing to Relocate" value={userProfile.willing_to_relocate} />
        </dl>
      </section>

      {/* Section 4: Work Experience */}
      <section id="work-experience" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Work Experience</h2>
        {workExperiences && workExperiences.length > 0 ? (
          <ul className="space-y-6">
            {workExperiences.map(exp => (
              <li key={exp.id} className="p-4 bg-gray-800 rounded-md shadow">
                <h3 className="text-lg font-semibold text-purple-300">{exp.job_title || 'N/A'}</h3>
                <p className="text-md text-gray-200">{exp.company_name || 'N/A'} {exp.company_location && `- ${exp.company_location}`}</p>
                <p className="text-sm text-gray-400">
                  {formatDate(exp.start_date)} &ndash; {exp.current_job ? 'Present' : formatDate(exp.end_date)}
                </p>
                {exp.job_description && <p className="mt-2 text-sm text-gray-300 whitespace-pre-line">{exp.job_description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No work experience added yet.</p>
        )}
      </section>

      {/* Section 5: Education */}
      <section id="education" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Education</h2>
        {educationHistory && educationHistory.length > 0 ? (
          <ul className="space-y-6">
            {educationHistory.map(edu => (
              <li key={edu.id} className="p-4 bg-gray-800 rounded-md shadow">
                <h3 className="text-lg font-semibold text-purple-300">{edu.school_name || 'N/A'}</h3>
                <p className="text-md text-gray-200">{edu.degree_level || 'N/A'} {edu.major && `- ${edu.major}`}</p>
                <p className="text-sm text-gray-400">
                  {edu.start_date ? `${formatDate(edu.start_date)} – ` : ''}{formatDate(edu.graduation_date) || 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No education history added yet.</p>
        )}
      </section>
      
      {/* Section 6: Statements & Additional Info */}
      <section id="additional-information" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3">Statements & Additional Info</h2>
        <dl className="space-y-4">
          <ProfileFieldDisplay label="Interest Statement" value={userProfile.interest_statement ? <p className="whitespace-pre-line text-gray-200">{userProfile.interest_statement}</p> : null} />
          <ProfileFieldDisplay label="Additional Information" value={userProfile.additional_info ? <p className="whitespace-pre-line text-gray-200">{userProfile.additional_info}</p> : null} />
        </dl>
      </section>

      {/* Section 7: Voluntary Information (Handle with care) */}
      <section id="voluntary-information" className="scroll-mt-24 p-6 bg-gray-700/50 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-gray-300 border-b border-gray-600 pb-3">Voluntary Self-Identification</h2>
        <p className="text-xs text-gray-500 mb-4">This information is voluntary.</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ProfileFieldDisplay label="Gender" value={userProfile.gender} />
          <ProfileFieldDisplay label="Race/Ethnicity" value={userProfile.race} />
          <ProfileFieldDisplay label="Veteran Status" value={userProfile.veteran_status} />
          <ProfileFieldDisplay label="Disability Status" value={userProfile.disability_status} />
        </dl>
      </section>
    </div>
  );
}