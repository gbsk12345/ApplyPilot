// src/components/dashboard/ProfileMenu.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // For optimized images if avatarUrl is used
// Example icons (ensure react-icons is installed: npm install react-icons)
// import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client'; // For client-side logout

interface ProfileMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
}

export default function ProfileMenu({ userName, userEmail, avatarUrl }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient(); // Client-side Supabase instance

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
      // Optionally display an error to the user
    } else {
      router.push('/login'); // Redirect to login page
      router.refresh(); // Crucial to re-trigger server components and auth checks
    }
  };

  const userInitial = userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="user-menu-button"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={userName || 'User Avatar'} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold text-white">
            {userInitial}
          </span>
        )}
        <span className="hidden md:inline text-sm text-gray-300 font-medium">{userName || 'User'}</span>
        <svg className={`hidden md:inline w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-60 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 z-50 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {(userName || userEmail) && (
            <div className="px-4 py-3 border-b border-gray-700">
              {userName && <p className="text-sm font-medium text-white truncate">{userName}</p>}
              {userEmail && <p className="text-xs text-gray-400 truncate">{userEmail}</p>}
            </div>
          )}
          <Link href="/dashboard/profile" // Create this page: src/app/dashboard/profile/page.tsx
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white w-full text-left transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem">
              {/* <FiUser className="mr-2.5" size={16} /> */}
              My Profile
          </Link>
          <Link href="/dashboard/settings" // Create this page: src/app/dashboard/settings/page.tsx
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:text-white w-full text-left transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem">
              {/* <FiSettings className="mr-2.5" size={16} /> */}
              Settings
          </Link>
          <div className="border-t border-gray-700 my-1"></div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors"
            role="menuitem"
          >
            {/* <FiLogOut className="mr-2.5" size={16} /> */}
            Logout
          </button>
        </div>
      )}
    </div>
  );
}