module.exports = {

"[project]/src/app/dashboard/ApplyButton.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/components/dashboard/ApplyButton.tsx
__turbopack_context__.s({
    "default": (()=>ApplyButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ProfileContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ProfileContext.tsx [app-ssr] (ecmascript)"); // Import the new hook
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)"); // Still needed for the auth token
'use client';
;
;
;
;
function ApplyButton({ jobUrl, jobTitle, onApplySuccess }) {
    // --- Consume data from our central contexts ---
    const { userProfile, educationHistory, isLoading: isProfileLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ProfileContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProfile"])();
    const { session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    // --- Local state for the button's own process ---
    const [isApplying, setIsApplying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [successMessage, setSuccessMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const backendApiUrl = ("TURBOPACK compile-time value", "http://localhost:4000");
    const handleApply = async ()=>{
        // --- Pre-flight checks ---
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        if (!session) {
            setError('You must be logged in to apply.');
            return;
        }
        if (isProfileLoading || !userProfile) {
            setError('Your profile data is still loading or not available. Please wait a moment.');
            return;
        }
        setError(null);
        setSuccessMessage(null);
        setIsApplying(true);
        try {
            // --- Dynamically assemble userData from the context ---
            const latestEducation = educationHistory?.[0]; // Get the most recent education record
            const userData = {
                "First Name": userProfile.first_name || '',
                "Last Name": userProfile.last_name || '',
                "Email": userProfile.email || '',
                "Phone": userProfile.phone || '',
                "Location (City)": userProfile.city ? `${userProfile.city}, ${userProfile.state || ''}`.trim().replace(/,$/, '') : '',
                "School": latestEducation?.school_name || '',
                "Degree": latestEducation?.degree_level || '',
                "Discipline": latestEducation?.major || '',
                "Start date month": latestEducation?.start_date ? new Date(latestEducation.start_date).toLocaleString('default', {
                    month: 'long'
                }) : '',
                "Start date year": latestEducation?.start_date ? new Date(latestEducation.start_date).getFullYear().toString() : '',
                "End date month": latestEducation?.graduation_date ? new Date(latestEducation.graduation_date).toLocaleString('default', {
                    month: 'long'
                }) : '',
                "End date year": latestEducation?.graduation_date ? new Date(latestEducation.graduation_date).getFullYear().toString() : '',
                "LinkedIn Profile": userProfile.linkedin_url || '',
                "Website": userProfile.website_url || '',
                // These fields are often job-specific, so we provide sensible defaults or use profile data.
                "How did you hear about this job?": "Referral",
                "Are you over 18 years of age?": "Yes",
                "Do you have unlimited and unrestricted authorization to work in the United States?": userProfile.authorized_to_work ? "Yes" : "No",
                "Will you, now or in the future, require company assistance or sponsorship…?": userProfile.needs_sponsorship ? "Yes" : "No",
                "Do you currently, or in the past year, work for or with a dealer…?": "No",
                "Are you currently subject to any restrictive covenant…?": "No"
            };
            // --- Make the API call ---
            const response = await fetch(`${backendApiUrl}/api/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    jobUrl,
                    userData
                })
            });
            const responseBody = await response.json();
            if (!response.ok) {
                throw new Error(responseBody.error || `Failed to apply (status ${response.status})`);
            }
            setSuccessMessage(`Successfully initiated application for: ${jobTitle || 'this job'}`);
            if (onApplySuccess) {
                onApplySuccess();
            }
        } catch (err) {
            console.error('Error during application process:', err);
            setError(err.message || 'An unexpected error occurred while trying to apply.');
        } finally{
            setIsApplying(false);
        }
    };
    const buttonDisabled = isApplying || isProfileLoading || !!successMessage;
    const getButtonText = ()=>{
        if (isProfileLoading) return 'Loading Profile...';
        if (isApplying) return 'Applying...';
        if (successMessage) return 'Applied!';
        return 'Auto-Apply';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleApply,
                disabled: buttonDisabled,
                className: `w-full sm:w-auto font-semibold py-2.5 px-5 rounded-lg text-sm text-center transition-colors duration-150 whitespace-nowrap shadow-md hover:shadow-lg
                    ${buttonDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                    ${successMessage ? 'bg-green-600 text-white' : ''}`,
                children: getButtonText()
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/ApplyButton.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-2 text-xs text-red-400 text-center sm:text-left",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/ApplyButton.tsx",
                lineNumber: 121,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true);
}
}}),
"[project]/src/app/dashboard/jobs/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/app/dashboard/jobs/page.tsx
__turbopack_context__.s({
    "default": (()=>DiscoverJobsPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$ApplyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/dashboard/ApplyButton.tsx [app-ssr] (ecmascript)"); // Assuming ApplyButton is in app/dashboard/ApplyButton.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)"); // Ensure this path is correct
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/supabase/client.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const JOBS_PER_PAGE = 30;
const SKILL_MATCH_THRESHOLD_PERCENTAGE = 60;
const DUMMY_USER_SKILLS = [
    "React",
    "TypeScript",
    "Node.js",
    "Next.js",
    "Communication",
    "Problem Solving",
    "SQL",
    "Project Management",
    "REST APIs",
    "Git"
];
const ALL_DUMMY_JOBS_SOURCE = [
    {
        id: '1',
        job_title: 'SmartRecuiter Job',
        company_name: 'Innovatech Solutions',
        location: 'Remote',
        experience_level: 'Mid-level',
        description_full: 'Build cutting-edge UIs with React & Next.js. Focus on user experience and responsive design...',
        date_posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        apply_url: 'https://jobs.smartrecruiters.com/oneclick-ui/company/ServiceNow/publication/d722dc74-a7e2-4a23-b239-08f0c05e1b71?dcr_ci=ServiceNow',
        created_at: new Date().toISOString(),
        jd_skills: [
            "React",
            "TypeScript",
            "Node.js",
            "Next.js",
            "Communication",
            "Problem Solving",
            "SQL",
            "Project Management",
            "REST APIs",
            "Git"
        ]
    },
    {
        id: '2',
        job_title: 'Greenhouse Job',
        company_name: 'Cloudflare',
        location: 'Remote (US Only)',
        experience_level: 'Entry-level',
        description_full: 'Create intuitive user experiences. Strong portfolio in Figma/Sketch required.',
        date_posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        apply_url: 'https://job-boards.greenhouse.io/cloudflare/jobs/6886051?gh_jid=6886051&utm_source=cvrve&ref=cvrve',
        created_at: new Date().toISOString(),
        jd_skills: [
            "React",
            "TypeScript",
            "Node.js",
            "Next.js",
            "Communication",
            "Problem Solving",
            "SQL",
            "Project Management",
            "REST APIs",
            "Git"
        ]
    },
    {
        id: '3',
        job_title: 'Lever Job',
        company_name: 'CloudNetics',
        location: 'Remote',
        experience_level: 'Senior',
        description_full: 'Manage and scale our cloud infrastructure on AWS. CI/CD, Docker, Kubernetes...',
        date_posted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        apply_url: 'https://jobs.lever.co/plusgrade/9c9728f3-031d-4df5-b3a3-f060e338f684/apply?utm_source=Simplify&ref=Simplify',
        created_at: new Date().toISOString(),
        jd_skills: [
            "React",
            "TypeScript",
            "Node.js",
            "Next.js",
            "Communication",
            "Problem Solving",
            "SQL",
            "Project Management",
            "REST APIs",
            "Git"
        ]
    },
    {
        id: '4',
        job_title: 'Ashby Job',
        company_name: 'Sentry',
        location: 'Remote',
        experience_level: 'Senior',
        description_full: 'Manage and scale our cloud infrastructure on AWS. CI/CD, Docker, Kubernetes...',
        date_posted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        apply_url: 'https://jobs.ashbyhq.com/sentry/90fb5dd4-410d-4672-9f40-3f11ea01c75d/application',
        created_at: new Date().toISOString(),
        jd_skills: [
            "React",
            "TypeScript",
            "Node.js",
            "Next.js",
            "Communication",
            "Problem Solving",
            "SQL",
            "Project Management",
            "REST APIs",
            "Git"
        ]
    }
];
// --- End of Dummy Data ---
// --- Helper Functions ---
const formatDatePosted = (dateString)=>{
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return `Posted 1 day ago`;
    if (diffDays <= 30) return `Posted ${diffDays} days ago`;
    return `Posted on ${date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
    })}`;
};
const calculateMatchScore = (userSkills, jdSkills)=>{
    if (!userSkills || userSkills.length === 0) return 0;
    if (!jdSkills || jdSkills.length === 0) return 0;
    const lowerUserSkills = userSkills.map((skill)=>skill.toLowerCase().trim());
    const lowerJdSkills = jdSkills.map((skill)=>skill.toLowerCase().trim());
    const matchingSkills = lowerUserSkills.filter((skill)=>lowerJdSkills.includes(skill));
    return matchingSkills.length / lowerUserSkills.length * 100;
};
function DiscoverJobsPage() {
    const { user, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    const [displayedJobs, setDisplayedJobs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [userSkills, setUserSkills] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isLoadingMore, setIsLoadingMore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalAvailableJobsInDB, setTotalAvailableJobsInDB] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    // State for managing which job description is expanded in-card (only one at a time)
    const [expandedJobId, setExpandedJobId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // State for managing the job detail modal
    const [selectedJobForModal, setSelectedJobForModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const toggleDescriptionExpansion = (jobId)=>{
        setExpandedJobId((prevId)=>prevId === jobId ? null : jobId);
    };
    const openJobDetailModal = (job)=>{
        setSelectedJobForModal(job);
    };
    const closeJobDetailModal = ()=>{
        setSelectedJobForModal(null);
    };
    // useEffect to handle 'Escape' key for closing the modal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleKeyDown = (event)=>{
            if (event.key === 'Escape') {
                closeJobDetailModal();
            }
        };
        if (selectedJobForModal) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return ()=>{
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        selectedJobForModal
    ]);
    const fetchUserSkills = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (userId)=>{
        console.log(`Placeholder: Fetching skills for user ${userId}...`);
        await new Promise((resolve)=>setTimeout(resolve, 100));
        return DUMMY_USER_SKILLS;
    }, []);
    const fetchJobsPageFromDB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (page, limit)=>{
        console.log(`SIMULATING DB FETCH: Page ${page}, Limit ${limit}`);
        await new Promise((resolve)=>setTimeout(resolve, 500));
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedJobs = ALL_DUMMY_JOBS_SOURCE.slice(start, end);
        return {
            jobs: paginatedJobs,
            totalCount: ALL_DUMMY_JOBS_SOURCE.length
        };
    }, []);
    const loadAndFilterJobs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (pageToLoad, skillsForMatching, isAppending)=>{
        if (skillsForMatching.length === 0 && pageToLoad === 1) {
            console.log("No user skills to match against, showing all jobs for page " + pageToLoad);
        }
        if (isAppending) setIsLoadingMore(true);
        else setIsLoading(true);
        setError(null);
        try {
            const { jobs: fetchedRawJobs, totalCount } = await fetchJobsPageFromDB(pageToLoad, JOBS_PER_PAGE);
            setTotalAvailableJobsInDB(totalCount);
            const newMatchedJobs = fetchedRawJobs.map((job)=>({
                    ...job,
                    matchPercentage: calculateMatchScore(skillsForMatching, job.jd_skills)
                })).filter((job)=>job.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE);
            if (isAppending) {
                setDisplayedJobs((prevJobs)=>[
                        ...prevJobs,
                        ...newMatchedJobs
                    ]);
            } else {
                setDisplayedJobs(newMatchedJobs);
            }
            setCurrentPage(pageToLoad); // Update current page after processing
        } catch (err) {
            console.error("Error in loadAndFilterJobs:", err);
            setError("Failed to load jobs. Please try refreshing.");
        } finally{
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [
        fetchJobsPageFromDB
    ]); // Removed skillsForMatching from here, will pass as arg
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (authLoading) {
            setIsLoading(true);
            return;
        }
        if (user) {
            setIsLoading(true);
            fetchUserSkills(user.id).then((skills)=>{
                setUserSkills(skills);
            }).catch((err)=>{
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
    }, [
        user,
        authLoading,
        fetchUserSkills
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // This effect runs when `user` is confirmed and `userSkills` are populated (or change)
        if (user && (userSkills.length > 0 || !isLoading)) {
            // console.log("User and skills ready, loading initial jobs (page 1).");
            setCurrentPage(1);
            setDisplayedJobs([]); // Clear for new filter/user
            loadAndFilterJobs(1, userSkills, false);
        }
    }, [
        user,
        userSkills,
        loadAndFilterJobs,
        isLoading
    ]); // Added isLoading to avoid running if skill fetch failed and set loading false
    const handleRefresh = ()=>{
        if (user && !isLoading && !isLoadingMore) {
            setExpandedJobId(null); // Collapse any open card on refresh
            setSelectedJobForModal(null); // Close modal on refresh
            setCurrentPage(1);
            loadAndFilterJobs(1, userSkills, false);
        }
    };
    const handleLoadMore = ()=>{
        const canActuallyLoad = currentPage * JOBS_PER_PAGE < totalAvailableJobsInDB;
        if (user && canActuallyLoad && !isLoadingMore && !isLoading) {
            const nextPage = currentPage + 1;
            loadAndFilterJobs(nextPage, userSkills, true);
        }
    };
    const canActuallyLoadMore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return currentPage * JOBS_PER_PAGE < totalAvailableJobsInDB;
    }, [
        currentPage,
        totalAvailableJobsInDB
    ]);
    // --- JSX ---
    if (authLoading || isLoading && displayedJobs.length === 0 && currentPage === 1) {
        return /* Your existing skeleton loader for initial page load */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl md:text-4xl font-bold text-gray-100",
                            children: "Discover Jobs"
                        }, void 0, false, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 216,
                            columnNumber: 17
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            disabled: true,
                            className: "bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg opacity-50 cursor-not-allowed",
                            children: "Refresh Jobs"
                        }, void 0, false, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 217,
                            columnNumber: 17
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                    lineNumber: 215,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse",
                    children: [
                        ...Array(3)
                    ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-800/50 p-6 rounded-xl shadow-lg h-72",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-6 bg-gray-700/50 rounded w-3/4 mb-3"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 224,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-4 bg-gray-700/50 rounded w-1/2 mb-2"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 225,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-4 bg-gray-700/50 rounded w-1/3 mb-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 226,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-16 bg-gray-700/50 rounded mb-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 227,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-4 bg-gray-700/50 rounded w-1/4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 229,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-10 bg-purple-600/50 rounded w-1/3"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 230,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 228,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 223,
                            columnNumber: 17
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                    lineNumber: 221,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
            lineNumber: 214,
            columnNumber: 9
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl md:text-4xl font-bold text-gray-100",
                        children: "Discover Jobs"
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 242,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleRefresh,
                        disabled: isLoading || isLoadingMore,
                        className: "bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 flex items-center gap-2 disabled:opacity-70",
                        children: isLoading && !isLoadingMore ? 'Refreshing...' : 'Refresh Jobs'
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 243,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 241,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-red-400 bg-red-900/30 p-4 rounded-md",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 253,
                columnNumber: 9
            }, this),
            !isLoading && !error && displayedJobs.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-12 bg-gray-800/50 rounded-lg shadow-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mx-auto text-4xl text-gray-500",
                        children: "🤷"
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 258,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "mt-4 text-xl font-medium text-white",
                        children: "No Matching Jobs Found"
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 259,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-gray-400",
                        children: [
                            "We couldn't find any open positions that match ",
                            SKILL_MATCH_THRESHOLD_PERCENTAGE,
                            "% or more of your current skills.",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                lineNumber: 262,
                                columnNumber: 13
                            }, this),
                            "Try updating your skills in your profile or check back later!"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 260,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 257,
                columnNumber: 9
            }, this),
            displayedJobs.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
                children: displayedJobs.map((job)=>{
                    const isDescriptionCurrentlyExpanded = expandedJobId === job.id;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col border border-gray-700/50 hover:border-purple-500/70  transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-purple-500/30",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-grow",
                                children: [
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between items-start",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        className: "text-xl font-semibold text-gray-100 leading-tight truncate pr-2",
                                                        title: job.job_title,
                                                        children: job.job_title
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 283,
                                                        columnNumber: 23
                                                    }, this),
                                                    job.matchPercentage !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${job.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`,
                                                        children: [
                                                            job.matchPercentage.toFixed(0),
                                                            "% Match"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 282,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-md text-purple-300",
                                                children: job.company_name
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 292,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                        lineNumber: 281,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1.5 text-sm text-gray-400 mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-lg",
                                                        children: "📍"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 297,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: job.location
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 298,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 296,
                                                columnNumber: 21
                                            }, this),
                                            job.experience_level && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-lg",
                                                        children: "📈"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 302,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: job.experience_level
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                        lineNumber: 303,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 301,
                                                columnNumber: 24
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                        lineNumber: 295,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-300 mb-4 leading-relaxed",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: !isDescriptionCurrentlyExpanded ? 'line-clamp-4' : '',
                                                children: job.description_full
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 310,
                                                columnNumber: 21
                                            }, this),
                                            job.description_full.length > 200 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>toggleDescriptionExpansion(job.id),
                                                className: "text-purple-400 hover:text-purple-300 text-xs font-semibold mt-2 hover:underline",
                                                children: isDescriptionCurrentlyExpanded ? 'Read Less' : 'Read More...'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 314,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                        lineNumber: 309,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                lineNumber: 280,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-auto pt-4 border-t border-gray-700 flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col sm:flex-row justify-between items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500 whitespace-nowrap self-center sm:self-auto",
                                                children: [
                                                    "⏳ ",
                                                    formatDatePosted(job.date_posted)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 327,
                                                columnNumber: 22
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>openJobDetailModal(job),
                                                className: "w-full sm:w-auto border border-purple-500/50 hover:border-purple-500 text-purple-300 hover:text-purple-200 font-semibold py-2 px-4 rounded-lg text-xs text-center transition-colors duration-150 whitespace-nowrap",
                                                children: "View Full Details"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                lineNumber: 330,
                                                columnNumber: 22
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                        lineNumber: 326,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$ApplyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        jobUrl: job.apply_url,
                                        jobTitle: job.job_title
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                        lineNumber: 337,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                lineNumber: 325,
                                columnNumber: 17
                            }, this)
                        ]
                    }, job.id, true, {
                        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                        lineNumber: 274,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 270,
                columnNumber: 9
            }, this),
            !isLoading && !error && canActuallyLoadMore && displayedJobs.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-10 text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleLoadMore,
                    disabled: isLoadingMore,
                    className: "bg-gray-700 hover:bg-gray-600 text-purple-300 font-semibold py-2.5 px-6 rounded-lg shadow-md transition duration-150 disabled:opacity-50 flex items-center justify-center mx-auto gap-2",
                    children: isLoadingMore ? 'Loading More...' : 'Load More Jobs'
                }, void 0, false, {
                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                    lineNumber: 351,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 350,
                columnNumber: 9
            }, this),
            selectedJobForModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm",
                onClick: closeJobDetailModal,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gray-800 text-gray-100 p-6 md:p-8 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col",
                    onClick: (e)=>e.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center mb-4 pb-3 border-b border-gray-700",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-semibold text-purple-400",
                                    children: selectedJobForModal.job_title
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 372,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: closeJobDetailModal,
                                    className: "text-gray-400 hover:text-white text-3xl leading-none",
                                    "aria-label": "Close modal",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 373,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 371,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "overflow-y-auto pr-2 space-y-4 flex-grow",
                            children: [
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg text-gray-200 mb-1",
                                    children: selectedJobForModal.company_name
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 383,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "📍 ",
                                                selectedJobForModal.location
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 385,
                                            columnNumber: 21
                                        }, this),
                                        selectedJobForModal.experience_level && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "📈 Experience: ",
                                                selectedJobForModal.experience_level
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 386,
                                            columnNumber: 62
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "⏳ Posted: ",
                                                formatDatePosted(selectedJobForModal.date_posted)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 387,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 384,
                                    columnNumber: 17
                                }, this),
                                selectedJobForModal.matchPercentage !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: `font-semibold mb-3 ${selectedJobForModal.matchPercentage >= SKILL_MATCH_THRESHOLD_PERCENTAGE ? 'text-green-400' : 'text-yellow-400'}`,
                                    children: [
                                        "Skill Match: ",
                                        selectedJobForModal.matchPercentage.toFixed(0),
                                        "%"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 391,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-lg font-semibold text-gray-200 mb-1",
                                            children: "Full Job Description:"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 397,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-line",
                                            children: selectedJobForModal.description_full
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 398,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 396,
                                    columnNumber: 17
                                }, this),
                                selectedJobForModal.jd_skills && selectedJobForModal.jd_skills.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: "text-md font-semibold text-gray-200 mb-1",
                                            children: "Skills Mentioned:"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 405,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-wrap gap-2",
                                            children: selectedJobForModal.jd_skills.map((skill)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-full",
                                                    children: skill
                                                }, skill, false, {
                                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 33
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                            lineNumber: 406,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                    lineNumber: 404,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 382,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-6 pt-4 border-t border-gray-700 flex justify-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$ApplyButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                jobUrl: selectedJobForModal.apply_url,
                                jobTitle: selectedJobForModal.job_title
                            }, void 0, false, {
                                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                                lineNumber: 416,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                            lineNumber: 415,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                    lineNumber: 367,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/jobs/page.tsx",
                lineNumber: 363,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/dashboard/jobs/page.tsx",
        lineNumber: 240,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=src_app_dashboard_0074fa5a._.js.map