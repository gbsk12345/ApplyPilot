// src/app/dashboard/layout.tsx
'use client'; // Make the layout a Client Component

import Sidebar from '@/app/dashboard/Sidebar';
import Topbar from '@/app/dashboard/Topbar';
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Adjust path if needed
import { useRouter } from 'next/navigation';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { createClient } from '@/utils/supabase/client'; // Client-side client

interface UserProfileLayoutData {
  firstName: string | null;
  email: string | null;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, session } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfileLayoutData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/'); // Redirect if not authenticated
        return;
      }

      // Fetch profile for Topbar
      const fetchProfile = async () => {
        setProfileLoading(true);
        const { data, error } = await supabase
          .from('user_profile')
          .select('first_name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Layout: Database error fetching user_profile:", error.message);
          // Potentially redirect or show error, for now, Topbar will show defaults
        } else if (!data) {
          console.log(`Layout: No profile found for user ${user.id}. Redirecting to onboarding.`);
          router.replace('/onboarding');
          return;
        }
        setUserProfile({
          firstName: data?.first_name || null,
          email: data?.email || user.email || null,
        });
        setProfileLoading(false);
      };

      fetchProfile();
    }
  }, [user, authLoading, router, supabase]);

  if (authLoading || (user && profileLoading && !userProfile)) {
    // Show a global loading state for the dashboard shell until user and minimal profile are loaded
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div>Loading Dashboard...</div> {/* Or a more sophisticated skeleton */}
      </div>
    );
  }

  // If user is null after auth check (and not loading), they'd have been redirected.
  // If user exists but profile fetch led to onboarding redirect, this part isn't reached.

  return (
    <div className="flex h-screen bg-gray-900 text-white antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          userName={userProfile?.firstName || user?.email || 'User'}
          userEmail={userProfile?.email || user?.email || ''}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// The actual default export for layout.tsx wraps content with AuthProvider
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </ProfileProvider>
    </AuthProvider>
  );
}