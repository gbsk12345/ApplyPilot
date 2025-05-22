'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
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
  console.log(`Workspaceing profile summary for user ${userId} from database`); // Your log
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

export default function ClientOverview() {
  const [summary, setSummary] = useState<ProfileSummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const loadedDataForUserIdRef = useRef<string | null>(null);

  const loadDataForUser = useCallback(async (user: User) => {
    setIsLoading(true);
    const localStorageKey = `profileSummary-${user.id}`;
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
      const freshSummary = await fetchProfileSummaryFromDB(user.id, supabase);
      setSummary(freshSummary);
      localStorage.setItem(localStorageKey, JSON.stringify(freshSummary));
      loadedDataForUserIdRef.current = user.id;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      const previousLoadedUserId = loadedDataForUserIdRef.current;
      setCurrentUser(user);

      if (user) {
        if (user.id !== previousLoadedUserId) {
          await loadDataForUser(user);
        } else {
          setIsLoading(false);
        }
      } else {
        setSummary(initialSummary);
        if (previousLoadedUserId) {
          localStorage.removeItem(`profileSummary-${previousLoadedUserId}`);
        }
        loadedDataForUserIdRef.current = null;
        setIsLoading(false);
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, loadDataForUser]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-700/50 p-6 rounded-lg shadow-lg h-40"> {/* Adjusted height for skeleton */}
            <div className="h-6 bg-gray-600/50 rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-gray-600/50 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-600/50 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card 1: Work Experiences */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Work Experiences</h2>
        <p className="text-5xl font-bold text-purple-400 mb-3">{summary.workExperienceCount}</p>
        <Link href="/dashboard/profile#work-experience" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
          Manage Experiences
        </Link>
      </div>

      {/* Card 2: Education Entries */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Education Entries</h2>
        <p className="text-5xl font-bold text-purple-400 mb-3">{summary.educationCount}</p>
        <Link href="/dashboard/profile#education" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
          Manage Education
        </Link>
      </div>

      {/* Card 3: Tracked Applications */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:bg-gray-700/70 hover:shadow-purple-500/40 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Tracked Applications</h2>
        <p className="text-5xl font-bold text-purple-400 mb-3">{summary.applicationCount}</p>
        <Link href="/dashboard/applications" className="text-sm text-purple-300 hover:text-purple-200 hover:underline transition-colors">
          View Applications
        </Link>
      </div>
    </div>
  );
}