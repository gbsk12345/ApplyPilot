// src/app/dashboard/overview/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // Use the AuthContext
import type { User } from '@supabase/supabase-js';

interface ProfileSummary {
  workExperienceCount: number;
  educationCount: number;
  applicationCount: number;
}

const initialSummary: ProfileSummary = {
  workExperienceCount: 0,
  educationCount: 0,
  applicationCount: 0,
};

async function fetchProfileSummaryFromDB(userId: string, supabaseClient: ReturnType<typeof createClient>): Promise<ProfileSummary> {
  console.log(`Workspaceing profile summary for user ${userId} from database`);
  try {
    const [we, ed, ap] = await Promise.all([
      supabaseClient.from('work_experience').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseClient.from('education').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseClient.from('application').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    if (we.error) console.error('Work Experience fetch error:', we.error.message);
    if (ed.error) console.error('Education fetch error:', ed.error.message);
    if (ap.error) console.error('Application fetch error:', ap.error.message);

    return {
      workExperienceCount: we.count ?? 0,
      educationCount: ed.count ?? 0,
      applicationCount: ap.count ?? 0,
    };
  } catch (error) {
    console.error("Generic error in fetchProfileSummaryFromDB:", error);
    return { ...initialSummary };
  }
}

export default function OverviewPage() {
  const { user, loading: authLoading } = useAuth(); // Get user from AuthContext
  const [summary, setSummary] = useState<ProfileSummary>(initialSummary);
  const [isDataLoading, setIsDataLoading] = useState(true); // Specific for summary data
  
  const supabase = createClient();
  const loadedDataForUserIdRef = useRef<string | null>(null);

  const loadDataForUser = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    const localStorageKey = `profileSummary-${userId}`;
    const cachedRaw = localStorage.getItem(localStorageKey);

    if (cachedRaw) {
      try {
        setSummary(JSON.parse(cachedRaw));
      } catch (e) {
        console.error("Failed to parse summary from localStorage:", e);
        localStorage.removeItem(localStorageKey);
      }
    }

    try {
      const freshSummary = await fetchProfileSummaryFromDB(userId, supabase);
      setSummary(freshSummary);
      localStorage.setItem(localStorageKey, JSON.stringify(freshSummary));
      loadedDataForUserIdRef.current = userId;
    } finally {
      setIsDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) { // Wait for auth to resolve
      setIsDataLoading(true); // Keep data loading until auth is known
      return;
    }

    if (user) {
      if (user.id !== loadedDataForUserIdRef.current) {
        loadDataForUser(user.id);
      } else {
        setIsDataLoading(false); // User is same, data presumably loaded or being loaded
      }
    } else {
      // No user
      setSummary(initialSummary);
      if (loadedDataForUserIdRef.current) { // Clear LS for previously loaded user
        localStorage.removeItem(`profileSummary-${loadedDataForUserIdRef.current}`);
      }
      loadedDataForUserIdRef.current = null;
      setIsDataLoading(false);
    }
  }, [user, authLoading, loadDataForUser]);

  // UI for the Overview Page
  const pageLoading = authLoading || (user && isDataLoading && summary === initialSummary);

  if (pageLoading) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">Overview</h1>
        <div className="mt-6">
          <p className="text-gray-300 mb-8">Loading your summary...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-700/50 p-6 rounded-lg shadow-lg h-40">
                <div className="h-6 bg-gray-600/50 rounded w-3/4 mb-2"></div>
                <div className="h-10 bg-gray-600/50 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-600/50 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">Overview</h1>
      <div className="mt-6">
        <p className="text-gray-300 mb-8">
          Welcome back, {user?.email || 'User'}! Here&apos;s a summary of your profile and activities.
        </p>
        
        {/* The 3 Cards with styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Work Experiences</h2>
            <p className="text-5xl font-bold text-purple-400 mb-3">{summary.workExperienceCount}</p>
            <Link href="/dashboard/profile#work-experience" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
              Manage Experiences
            </Link>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Education Entries</h2>
            <p className="text-5xl font-bold text-purple-400 mb-3">{summary.educationCount}</p>
            <Link href="/dashboard/profile#education" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
              Manage Education
            </Link>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Tracked Applications</h2>
            <p className="text-5xl font-bold text-purple-400 mb-3">{summary.applicationCount}</p>
            <Link href="/dashboard/applications" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
              View Applications
            </Link>
          </div>
        </div>

        <div className="mt-10 bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Next Steps</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Complete all sections of your <Link href="/dashboard/profile" className="text-purple-300 hover:underline">profile</Link>.</li>
            <li>Start tracking your job <Link href="/dashboard/applications" className="text-purple-300 hover:underline">applications</Link>.</li>
            <li>Review your resume and cover letter templates.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}