// src/app/dashboard/jobs/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ApplyButton from '../ApplyButton';
import { useAuth } from '@/contexts/AuthContext';

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

const JOBS_PER_PAGE = 6;
const SKILL_MATCH_THRESHOLD_PERCENTAGE = 60;

// --- Dummy Data & Placeholders ---
const DUMMY_USER_SKILLS: string[] = ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"];

const ALL_DUMMY_JOBS_SOURCE: JobListing[] = [
  { id: '1', job_title: 'SmartRecuiter Job', company_name: 'Innovatech Solutions', location: 'Remote', experience_level: 'Mid-level', description_full: 'Build cutting-edge UIs with React & Next.js. Focus on user experience and responsive design...', date_posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://jobs.smartrecruiters.com/oneclick-ui/company/ServiceNow/publication/d722dc74-a7e2-4a23-b239-08f0c05e1b71?dcr_ci=ServiceNow', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },
  { id: '2', job_title: 'Greenhouse Job', company_name: 'Cloudflare', location: 'Remote (US Only)', experience_level: 'Entry-level', description_full: 'Create intuitive user experiences. Strong portfolio in Figma/Sketch required.', date_posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://job-boards.greenhouse.io/cloudflare/jobs/6886051?gh_jid=6886051&utm_source=cvrve&ref=cvrve', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },
  { id: '3', job_title: 'Lever Job', company_name: 'CloudNetics', location: 'Remote', experience_level: 'Senior', description_full: 'Manage and scale our cloud infrastructure on AWS. CI/CD, Docker, Kubernetes...', date_posted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), apply_url: 'https://jobs.lever.co/plusgrade/9c9728f3-031d-4df5-b3a3-f060e338f684/apply?utm_source=Simplify&ref=Simplify', created_at: new Date().toISOString(), jd_skills: ["React", "TypeScript", "Node.js", "Next.js", "Communication", "Problem Solving", "SQL", "Project Management", "REST APIs", "Git"] },
];

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

export default function DiscoverJobsPage() {
  const { user, loading: authLoading } = useAuth();


  const [displayedJobs, setDisplayedJobs] = useState<JobListing[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAvailableJobsInDB, setTotalAvailableJobsInDB] = useState(0); // Total count of all jobs in DB

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
    } catch (err: any) {
      console.error("Error in loadAndFilterJobs:", err);
      setError("Failed to load jobs. Please try refreshing.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchJobsPageFromDB]);
  useEffect(() => {
    if (user && !authLoading) {
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
    } else if (!user && !authLoading) {
      // No user, clear data
      setUserSkills([]);
      setDisplayedJobs([]);
      setCurrentPage(1);
      setTotalAvailableJobsInDB(0);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchUserSkills]);

  // Effect 2: Load jobs when user is available AND userSkills are populated
  useEffect(() => {
    if (user && userSkills.length > 0) {
      setCurrentPage(1);
      setDisplayedJobs([]);
      loadAndFilterJobs(1, userSkills, false);
    }
    else if (user && userSkills.length === 0 && !isLoading && !error) {
        setCurrentPage(1);
        setDisplayedJobs([]);
        loadAndFilterJobs(1, [], false);
    }

  }, [user, userSkills, loadAndFilterJobs]);

  const handleRefresh = () => {
    if (user && !isLoading && !isLoadingMore) {
      setCurrentPage(1);
      loadAndFilterJobs(1, userSkills, false);
    }
  };

  const handleLoadMore = () => {
    const canActuallyLoadMore = (currentPage * JOBS_PER_PAGE) < totalAvailableJobsInDB;
    if (user && canActuallyLoadMore && !isLoadingMore && !isLoading) {
      const nextPage = currentPage + 1;
      loadAndFilterJobs(nextPage, userSkills, true);
    }
  };
  
  const canActuallyLoadMore = useMemo(() => {
    return (currentPage * JOBS_PER_PAGE) < totalAvailableJobsInDB;
  }, [currentPage, totalAvailableJobsInDB]);


  // --- JSX ---
  if (authLoading || (isLoading && displayedJobs.length === 0 && currentPage === 1)) {
    return (
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
            We couldn&apos;t find any open positions that match {SKILL_MATCH_THRESHOLD_PERCENTAGE}% or more of your skills right now.
            <br />
            Try updating your skills in your profile or check back later!
          </p>
        </div>
      )}

      {displayedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col justify-between
                         border border-gray-700/50 hover:border-purple-500/70 
                         transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-purple-500/30"
            >
              <div> {/* Card content wrapper */}
                <div className="mb-3">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-100 leading-tight truncate pr-2" title={job.job_title}>
                      {job.job_title}
                    </h2>
                    {job.matchPercentage !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${job.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
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
                
                <p className="text-sm text-gray-300 mb-4 line-clamp-4 leading-relaxed">
                  {job.description_full}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  ⏳ {formatDatePosted(job.date_posted)}
                </p>
                <ApplyButton jobUrl={job.apply_url} jobTitle={job.job_title} />
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}