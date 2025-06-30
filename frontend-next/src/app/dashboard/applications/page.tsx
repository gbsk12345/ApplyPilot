// src/app/dashboard/applications/page.tsx
'use client';
// Now client side
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  application_date: string | null;
  status: string;
}

interface CachedApplications {
  timestamp: number;
  data: Application[];
}

const initialApplications: Application[] = [];
const CACHE_DURATION_MS = 60 * 1000; // 5 minutes

async function fetchApplicationsFromDB(userId: string, supabaseClient: ReturnType<typeof createClient>): Promise<Application[]> {
  console.log(`Workspaceing applications for user ${userId} from database`);
  const { data, error } = await supabaseClient
    .from('application')
    .select('id, job_title, company_name, application_date, status')
    .eq('user_id', userId)
    .order('application_date', { ascending: false });

  if (error) {
    console.error("Error fetching applications from DB:", error.message);
    throw error;
  }
  return (data as Application[]) || [];
}

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const supabase = createClient();

  const loadApplications = useCallback(async (currentUser: User) => {
    setIsLoading(true);
    setFetchError(null);
    const localStorageKey = `applications-${currentUser.id}`;

    const cachedItem = localStorage.getItem(localStorageKey);
    if (cachedItem) {
      try {
        const parsedCache: CachedApplications = JSON.parse(cachedItem);
        if (Date.now() - parsedCache.timestamp < CACHE_DURATION_MS) {
          setApplications(parsedCache.data);
          setIsLoading(false);
          console.log("Loaded applications from fresh localStorage cache.");
          return;
        }
        setApplications(parsedCache.data);
        console.log("Loaded applications from stale localStorage cache, will refresh.");
      } catch (e) {
        console.error("Failed to parse applications from localStorage:", e);
        localStorage.removeItem(localStorageKey); // Clear corrupted item
      }
    }

    try {
      const freshApplications = await fetchApplicationsFromDB(currentUser.id, supabase);
      setApplications(freshApplications);
      const newCache: CachedApplications = {
        timestamp: Date.now(),
        data: freshApplications,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(newCache));
      console.log("Fetched fresh applications and updated localStorage.");
    } catch (error) {
      setFetchError("Could not fetch applications. Please try again later.");
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
      loadApplications(user);
    } else {
      setApplications(initialApplications);
      setIsLoading(false);
      setFetchError(null);
    }
  }, [user, authLoading, loadApplications]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };


  if (isLoading && applications.length === 0) { // Show skeleton only if truly loading initial data
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">My Job Applications</h1>
          {/* Add New button can be a skeleton too or shown */}
        </div>
        <div className="overflow-x-auto bg-gray-700/50 shadow-md rounded-lg p-4 animate-pulse">
           <div className="h-8 bg-gray-600/50 rounded w-1/4 mb-4"></div> {/* Header skeleton */}
           {[...Array(3)].map((_, i) => (
             <div key={i} className="h-12 bg-gray-600/50 rounded mb-2"></div> /* Row skeleton */
           ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">My Job Applications</h1>
        <Link
          href="/dashboard/applications/new"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          + Add New Application
        </Link>
      </div>

      {fetchError && (
        <p className="text-red-400 bg-red-900/30 p-3 rounded-md mb-4">{fetchError}</p>
      )}
      
      {!isLoading && !fetchError && applications.length === 0 && (
        <div className="text-center py-10 bg-gray-700 rounded-lg shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-white">No applications tracked</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by adding your first job application.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/applications/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            >
              Add New Application
            </Link>
          </div>
        </div>
      )}

      {!fetchError && applications.length > 0 && (
        <div className="overflow-x-auto bg-gray-700 shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-200 uppercase bg-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3">Job Title</th>
                <th scope="col" className="px-6 py-3">Company</th>
                <th scope="col" className="px-6 py-3">Date Applied</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-600 hover:bg-gray-600/50">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{app.job_title}</th>
                  <td className="px-6 py-4">{app.company_name}</td>
                  <td className="px-6 py-4">{formatDate(app.application_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      app.status === 'Applied' ? 'bg-blue-500 text-blue-100' :
                      app.status === 'Interviewing' ? 'bg-yellow-500 text-yellow-100' :
                      app.status === 'Offer' ? 'bg-green-500 text-green-100' : 
                      app.status === 'Rejected' ? 'bg-red-500 text-red-100' : 
                      app.status === 'Wishlist' ? 'bg-indigo-500 text-indigo-100' : 
                      'bg-gray-500 text-gray-100'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/applications/edit/${app.id}`} className="font-medium text-purple-400 hover:underline">
                      View/Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}