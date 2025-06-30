'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
// --- Helper Components & Functions (can be moved to utils) ---
// These helpers can stay as they are purely for display logic.
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


// --- Main Page Component ---
export default function ProfilePage() {
  // All data and loading/error states now come directly from the shared context.
  const { 
    userProfile, 
    educationHistory, 
    workExperiences, 
    isLoading, 
    error: fetchError 
  } = useProfile();
  
  const { user } = useAuth();

  if (isLoading) {
    // A simple loading state. You can keep your more detailed skeleton loader here.
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
  
  if (!userProfile) {
    // This case now cleanly handles when a user is logged in but has no profile data,
    // or when the user is logged out.
    return <p className="text-gray-400">No profile data found. Please complete your profile.</p>;
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

      {/* The rest of your JSX remains exactly the same, as it already uses the correct variable names */}

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
