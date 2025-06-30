// src/contexts/ProfileContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have this from your setup
import type { User } from '@supabase/supabase-js';

// --- Data Interfaces (copied from your ProfilePage) ---
interface UserProfile {
  user_id: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
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

// --- Context Definition ---
interface ProfileContextType {
  userProfile: UserProfile | null;
  educationHistory: Education[];
  workExperiences: WorkExperience[];
  isLoading: boolean;
  error: string | null;
  fetchProfileData: () => void; // Expose a function to allow manual re-fetchin
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// --- Provider Component ---
export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [educationHistory, setEducationHistory] = useState<Education[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data from Supabase in parallel
      const [profileResult, educationResult, workExperienceResult] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', user.id).single<UserProfile>(),
        supabase.from('education').select('*').eq('user_id', user.id).order('graduation_date', { ascending: false }).returns<Education[]>(),
        supabase.from('work_experience').select('*').eq('user_id', user.id).order('end_date', { ascending: false, nullsFirst: false }).order('start_date', { ascending: false }).returns<WorkExperience[]>()
      ]);

      // Check for errors in each request
      if (profileResult.error && profileResult.error.code !== 'PGRST116') { // PGRST116 means no row was found, which is not a fatal error
        throw new Error(`Profile fetch error: ${profileResult.error.message}`);
      }
      if (educationResult.error) throw new Error(`Education fetch error: ${educationResult.error.message}`);
      if (workExperienceResult.error) throw new Error(`Work experience fetch error: ${workExperienceResult.error.message}`);

      // Set the state with the fetched data
      setUserProfile(profileResult.data);
      setEducationHistory(educationResult.data || []);
      setWorkExperiences(workExperienceResult.data || []);

    } catch (err: any) {
      console.error("Error loading profile data into context:", err);
      setError(err.message || "Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Effect to fetch data when the user logs in or the page loads
  useEffect(() => {
    if (user && !authLoading) {
      fetchProfileData();
    } else if (!user && !authLoading) {
      // If there's no user, stop loading and clear data
      setIsLoading(false);
      setUserProfile(null);
      setEducationHistory([]);
      setWorkExperiences([]);
      setError(null);
    }
  }, [user, authLoading, fetchProfileData]);

  // The value that will be available to all consuming components
  const value = {
    userProfile,
    educationHistory,
    workExperiences,
    isLoading,
    error,
    fetchProfileData
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// --- Custom Hook for easy consumption ---
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
