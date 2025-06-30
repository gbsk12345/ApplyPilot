// src/app/dashboard/jobs/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import ApplyButton from '../ApplyButton'; // Assuming ApplyButton is in app/dashboard/ApplyButton.tsx
import { useAuth } from '@/contexts/AuthContext'; // Ensure this path is correct
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

// --- Interface Definition ---
interface JobListing {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  experience_level?: string | null;
  description_full: string;
  date_posted: string;
  apply_url: string;
  created_at: string;
  jd_skills: string[];
  matchPercentage?: number;
}

const JOBS_PER_PAGE = 30;
const SKILL_MATCH_THRESHOLD_PERCENTAGE = 60;

const DUMMY_USER_SKILLS: string[] = ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"];
const ALL_DUMMY_JOBS_SOURCE: JobListing[] = [
  { id: '1', job_title: 'SmartRecuiter Job', company_name: 'Innovatech Solutions', location: 'Remote', experience_level: 'Mid-level', description_full: 'Build cutting-edge UIs with React & Next.js. Focus on user experience and responsive design...', date_posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://jobs.smartrecruiters.com/oneclick-ui/company/ServiceNow/publication/d722dc74-a7e2-4a23-b239-08f0c05e1b71?dcr_ci=ServiceNow', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },
  { id: '2', job_title: 'Greenhouse Job', company_name: 'Cloudflare', location: 'Remote (US Only)', experience_level: 'Entry-level', description_full: 'Create intuitive user experiences. Strong portfolio in Figma/Sketch required.', date_posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://job-boards.greenhouse.io/cloudflare/jobs/6886051?gh_jid=6886051&utm_source=cvrve&ref=cvrve', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },
  { id: '3', job_title: 'Lever Job', company_name: 'CloudNetics', location: 'Remote', experience_level: 'Senior', description_full: 'Manage and scale our cloud infrastructure on AWS. CI/CD, Docker, Kubernetes...', date_posted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://jobs.lever.co/plusgrade/9c9728f3-031d-4df5-b3a3-f060e338f684/apply?utm_source=Simplify&ref=Simplify', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },

];
// --- End of Dummy Data ---

// --- Helper Functions ---
const formatDatePosted = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return `Posted 1 day ago`;
  if (diffDays <= 30) return `Posted ${diffDays} days ago`;
  return `Posted on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const calculateMatchScore = (userSkills: string[], jdSkills: string[]): number => {
  if (!userSkills || userSkills.length === 0) return 0;
  if (!jdSkills || jdSkills.length === 0) return 0;
  const lowerUserSkills = userSkills.map(skill => skill.toLowerCase().trim());
  const lowerJdSkills = jdSkills.map(skill => skill.toLowerCase().trim());
  const matchingSkills = lowerUserSkills.filter(skill => lowerJdSkills.includes(skill));
  return (matchingSkills.length / lowerUserSkills.length) * 100;
};
// --- End of Helper Functions ---

export default function DiscoverJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [displayedJobs, setDisplayedJobs] = useState<JobListing[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAvailableJobsInDB, setTotalAvailableJobsInDB] = useState(0);

  // State for managing which job description is expanded in-card (only one at a time)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  // State for managing the job detail modal
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobListing | null>(null);

  const toggleDescriptionExpansion = (jobId: string) => {
    setExpandedJobId(prevId => (prevId === jobId ? null : jobId));
  };

  const openJobDetailModal = (job: JobListing) => {
    setSelectedJobForModal(job);
  };

  const closeJobDetailModal = () => {
    setSelectedJobForModal(null);
  };

  // useEffect to handle 'Escape' key for closing the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeJobDetailModal();
      }
    };
    if (selectedJobForModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedJobForModal]);


  const fetchUserSkills = useCallback(async (userId: string) => {
    console.log(`Placeholder: Fetching skills for user ${userId}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return DUMMY_USER_SKILLS;
  }, []);

  const fetchJobsPageFromDB = useCallback(async (page: number, limit: number) => {
    console.log(`SIMULATING DB FETCH: Page ${page}, Limit ${limit}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedJobs = ALL_DUMMY_JOBS_SOURCE.slice(start, end);
    return { jobs: paginatedJobs, totalCount: ALL_DUMMY_JOBS_SOURCE.length };
  }, []);

  const loadAndFilterJobs = useCallback(async (pageToLoad: number, skillsForMatching: string[], isAppending: boolean) => {
    if (skillsForMatching.length === 0 && pageToLoad === 1) {
        console.log("No user skills to match against, showing all jobs for page " + pageToLoad);
    }

    if (isAppending) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);

    try {
      const { jobs: fetchedRawJobs, totalCount } = await fetchJobsPageFromDB(pageToLoad, JOBS_PER_PAGE);
      setTotalAvailableJobsInDB(totalCount);

      const newMatchedJobs = fetchedRawJobs.map(job => ({
        ...job,
        matchPercentage: calculateMatchScore(skillsForMatching, job.jd_skills),
      })).filter(job => job.matchPercentage! >= SKILL_MATCH_THRESHOLD_PERCENTAGE);

      if (isAppending) {
        setDisplayedJobs(prevJobs => [...prevJobs, ...newMatchedJobs]);
      } else {
        setDisplayedJobs(newMatchedJobs);
      }
      setCurrentPage(pageToLoad); // Update current page after processing
    } catch (err: any) {
      console.error("Error in loadAndFilterJobs:", err);
      setError("Failed to load jobs. Please try refreshing.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchJobsPageFromDB]); // Removed skillsForMatching from here, will pass as arg

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (user) {
      setIsLoading(true);
      fetchUserSkills(user.id)
        .then(skills => {
          setUserSkills(skills);
        })
        .catch(err => {
          console.error("Failed to fetch user skills:", err);
          setError("Could not load your skills profile to match jobs.");
          setIsLoading(false);
        });
    } else {
      setUserSkills([]);
      setDisplayedJobs([]);
      setCurrentPage(1);
      setTotalAvailableJobsInDB(0);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchUserSkills]);

  useEffect(() => {
    // This effect runs when `user` is confirmed and `userSkills` are populated (or change)
    if (user && (userSkills.length > 0 || !isLoading)) { // Proceed if skills are loaded or if it's a no-skill scenario post-initial load
      // console.log("User and skills ready, loading initial jobs (page 1).");
      setCurrentPage(1);
      setDisplayedJobs([]); // Clear for new filter/user
      loadAndFilterJobs(1, userSkills, false);
    }
  }, [user, userSkills, loadAndFilterJobs, isLoading]); // Added isLoading to avoid running if skill fetch failed and set loading false

  const handleRefresh = () => {
    if (user && !isLoading && !isLoadingMore) {
      setExpandedJobId(null); // Collapse any open card on refresh
      setSelectedJobForModal(null); // Close modal on refresh
      setCurrentPage(1);
      loadAndFilterJobs(1, userSkills, false);
    }
  };

  const handleLoadMore = () => {
    const canActuallyLoad = (currentPage * JOBS_PER_PAGE) < totalAvailableJobsInDB;
    if (user && canActuallyLoad && !isLoadingMore && !isLoading) {
      const nextPage = currentPage + 1;
      loadAndFilterJobs(nextPage, userSkills, true);
    }
  };
  
  const canActuallyLoadMore = useMemo(() => {
    return (currentPage * JOBS_PER_PAGE) < totalAvailableJobsInDB;
  }, [currentPage, totalAvailableJobsInDB]);


  // --- JSX ---
  if (authLoading || (isLoading && displayedJobs.length === 0 && currentPage === 1)) {
    return ( /* Your existing skeleton loader for initial page load */ 
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-100">Discover Jobs</h1>
                <button disabled className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg opacity-50 cursor-not-allowed">
                    Refresh Jobs
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 p-6 rounded-xl shadow-lg h-72"> 
                    <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/3 mb-4"></div>
                    <div className="h-16 bg-gray-700/50 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                    <div className="h-10 bg-purple-600/50 rounded w-1/3"></div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">Discover Jobs</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isLoadingMore}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 flex items-center gap-2 disabled:opacity-70"
        >
          {isLoading && !isLoadingMore ? 'Refreshing...' : 'Refresh Jobs'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 bg-red-900/30 p-4 rounded-md">{error}</p>
      )}

      {!isLoading && !error && displayedJobs.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg shadow-md">
          <p className="mx-auto text-4xl text-gray-500">🤷</p>
          <h3 className="mt-4 text-xl font-medium text-white">No Matching Jobs Found</h3>
          <p className="mt-1 text-sm text-gray-400">
            We couldn&apos;t find any open positions that match {SKILL_MATCH_THRESHOLD_PERCENTAGE}% or more of your current skills.
            <br />
            Try updating your skills in your profile or check back later!
          </p>
        </div>
      )}

      {/* Job Listings Grid */}
      {displayedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedJobs.map((job) => {
            const isDescriptionCurrentlyExpanded = expandedJobId === job.id;
            return (
              <div 
                key={job.id} 
                className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col
                           border border-gray-700/50 hover:border-purple-500/70 
                           transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-purple-500/30"
              >
                <div className="flex-grow"> {/* Allows description to expand without pushing footer down prematurely */}
                  <div className="mb-3">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold text-gray-100 leading-tight truncate pr-2" title={job.job_title}>
                        {job.job_title}
                      </h2>
                      {job.matchPercentage !== undefined && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${job.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                             {job.matchPercentage.toFixed(0)}% Match
                          </span>
                      )}
                    </div>
                    <p className="text-md text-purple-300">{job.company_name}</p>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span>{job.location}</span>
                    </div>
                    {job.experience_level && (
                       <div className="flex items-center gap-2">
                          <span className="text-lg">📈</span>
                          <span>{job.experience_level}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Expandable Description */}
                  <div className="text-sm text-gray-300 mb-4 leading-relaxed">
                    <p className={!isDescriptionCurrentlyExpanded ? 'line-clamp-4' : ''}>
                      {job.description_full}
                    </p>
                    {job.description_full.length > 200 && ( // Show toggle only for longer descriptions
                        <button
                            onClick={() => toggleDescriptionExpansion(job.id)}
                            className="text-purple-400 hover:text-purple-300 text-xs font-semibold mt-2 hover:underline"
                        >
                            {isDescriptionCurrentlyExpanded ? 'Read Less' : 'Read More...'}
                        </button>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                     <p className="text-xs text-gray-500 whitespace-nowrap self-center sm:self-auto">
                        ⏳ {formatDatePosted(job.date_posted)}
                     </p>
                     <button
                        onClick={() => openJobDetailModal(job)}
                        className="w-full sm:w-auto border border-purple-500/50 hover:border-purple-500 text-purple-300 hover:text-purple-200 font-semibold py-2 px-4 rounded-lg text-xs text-center transition-colors duration-150 whitespace-nowrap"
                      >
                        View Full Details
                      </button>
                  </div>
                  <ApplyButton 
                    jobUrl={job.apply_url} 
                    jobTitle={job.job_title} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {!isLoading && !error && canActuallyLoadMore && displayedJobs.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="bg-gray-700 hover:bg-gray-600 text-purple-300 font-semibold py-2.5 px-6 rounded-lg shadow-md transition duration-150 disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
          >
            {isLoadingMore ? 'Loading More...' : 'Load More Jobs'}
          </button>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJobForModal && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeJobDetailModal} // Close on overlay click
        >
          <div 
            className="bg-gray-800 text-gray-100 p-6 md:p-8 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
              <h2 className="text-2xl font-semibold text-purple-400">{selectedJobForModal.job_title}</h2>
              <button 
                onClick={closeJobDetailModal} 
                className="text-gray-400 hover:text-white text-3xl leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 flex-grow"> {/* Scrollable content area */}
                <p className="text-lg text-gray-200 mb-1">{selectedJobForModal.company_name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                    <span>📍 {selectedJobForModal.location}</span>
                    {selectedJobForModal.experience_level && <span>📈 Experience: {selectedJobForModal.experience_level}</span>}
                    <span>⏳ Posted: {formatDatePosted(selectedJobForModal.date_posted)}</span>
                </div>
                
                {selectedJobForModal.matchPercentage !== undefined && (
                    <p className={`font-semibold mb-3 ${selectedJobForModal.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE ? 'text-green-400' : 'text-yellow-400'}`}>
                        Skill Match: {selectedJobForModal.matchPercentage.toFixed(0)}%
                    </p>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-1">Full Job Description:</h3>
                    <div className="prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-line">
                        {selectedJobForModal.description_full}
                    </div>
                </div>

                {selectedJobForModal.jd_skills && selectedJobForModal.jd_skills.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-md font-semibold text-gray-200 mb-1">Skills Mentioned:</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedJobForModal.jd_skills.map(skill => (
                                <span key={skill} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-full">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
              <ApplyButton 
                jobUrl={selectedJobForModal.apply_url} 
                jobTitle={selectedJobForModal.job_title} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}