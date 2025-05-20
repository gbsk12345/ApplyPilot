// src/app/dashboard/overview/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileSummary = {
    workExperienceCount: 0,
    educationCount: 0,
    applicationCount: 0, // Will require 'applications' table
  };

  if (user) {
    const { count: workCount } = await supabase
      .from('Work_Experience') // Using schema name
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const { count: eduCount } = await supabase
      .from('Education') // Using schema name
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);


    const { count: appCount } = await supabase
      .from('Applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    profileSummary.workExperienceCount = workCount ?? 0;
    profileSummary.educationCount = eduCount ?? 0;
    profileSummary.applicationCount = appCount ?? 0;
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">Overview</h1>
      <div className="mt-6">
        <p className="text-gray-300 mb-8">Welcome back! Here's a summary of your profile and activities.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow">
            <h2 className="text-xl font-semibold text-white mb-2">Work Experiences</h2>
            <p className="text-4xl font-bold text-purple-400">{profileSummary.workExperienceCount}</p>
            <Link href="/dashboard/profile#work-experience" className="text-sm text-purple-300 hover:underline mt-3 block">Manage Experiences</Link>
          </div>
          
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow">
            <h2 className="text-xl font-semibold text-white mb-2">Education Entries</h2>
            <p className="text-4xl font-bold text-purple-400">{profileSummary.educationCount}</p>
            <Link href="/dashboard/profile#education" className="text-sm text-purple-300 hover:underline mt-3 block">Manage Education</Link>
          </div>
          
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow">
            <h2 className="text-xl font-semibold text-white mb-2">Tracked Applications</h2>
            {/* Placeholder until 'applications' table is active */}
            <p className="text-4xl font-bold text-purple-400">0 {/* profileSummary.applicationCount */}</p>
            <Link href="/dashboard/applications" className="text-sm text-purple-300 hover:underline mt-3 block">View Applications</Link>
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