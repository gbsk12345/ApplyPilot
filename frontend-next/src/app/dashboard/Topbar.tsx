// src/components/dashboard/Topbar.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import ProfileMenu from './ProfileMenu';
// Example icon (ensure react-icons is installed: npm install react-icons)
// import { FiMenu } from 'react-icons/fi';

const getTitleFromPathname = (pathname: string): string => {
  if (pathname.startsWith('/dashboard/overview')) return 'Overview';
  if (pathname.startsWith('/dashboard/applications/new')) return 'New Application';
  if (pathname.startsWith('/dashboard/applications/edit')) return 'Edit Application';
  if (pathname.startsWith('/dashboard/applications')) return 'Applications';
  if (pathname.startsWith('/dashboard/profile')) return 'My Profile';
  if (pathname.startsWith('/dashboard/settings')) return 'Settings';
  return 'Dashboard'; // Default
};

interface TopbarProps {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  // onToggleMobileMenu?: () => void; // Add this if Sidebar's mobile toggle is controlled from layout/topbar
}

export default function Topbar({ userName, userEmail, avatarUrl /*, onToggleMobileMenu */ }: TopbarProps) {
  const pathname = usePathname();
  const currentTitle = getTitleFromPathname(pathname);

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between h-16 flex-shrink-0 sticky top-0 z-10"> {/* Added sticky top-0 z-10 */}
      <div className="flex items-center">
        {/* If you move the mobile menu toggle button here:
          <button 
            onClick={onToggleMobileMenu} 
            className="md:hidden mr-3 p-1 text-gray-400 hover:text-white"
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button> 
        */}
        <h1 className="text-lg md:text-xl font-semibold text-gray-100">{currentTitle}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Add other icons like notifications here if needed */}
        <ProfileMenu userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}