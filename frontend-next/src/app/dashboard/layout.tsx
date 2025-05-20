// src/app/dashboard/layout.tsx
import Sidebar from '@/app/dashboard/Sidebar';
import Topbar from '@/app/dashboard/Topbar';
import React from 'react';
import { createClient } from '@/utils/supabase/server'; // Ensure this path is correct
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated or error fetching user:', userError);
    redirect('/login'); // Or your specific login page route
  }

  // Fetch profile data including onboarding status, full_name, and email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name, email, avatar_url') // Added avatar_url
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found
    console.error("Error fetching profile for dashboard layout:", profileError.message);
    redirect('/login'); // Or an error page
  }
  
  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  // User is authenticated and onboarded
  return (
    <div className="flex h-screen bg-gray-900 text-white antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          userName={profile?.full_name || user.email} 
          userEmail={profile?.email || user.email} // Use profile email or auth email as fallback
          avatarUrl={profile?.avatar_url}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}