// src/components/dashboard/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
// Example icons (install react-icons: npm install react-icons)
// import { FiHome, FiBriefcase, FiMenu, FiX, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface NavItem {
  name: string;
  href: string;
  icon?: React.ElementType; // For icon components
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard/overview',},
  { name: 'My Applications', href: '/dashboard/applications',},
  // Add more dashboard sections here like:
   { name: 'Discover Jobs', href: '/dashboard/jobs' },
  // { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // For desktop collapsible sidebar
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false); // Close mobile menu on route change
  }, [pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const SidebarContent = () => (
    <div className={`bg-gray-900 border-r border-gray-700 p-4 flex flex-col h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20 items-center' : 'w-64'}`}>
      <div className={`flex items-center mb-10 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isSidebarCollapsed && (
          <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
            ApplyPilot
          </Link>
        )}
        <button 
          onClick={toggleSidebarCollapse} 
          className="hidden md:block p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* {isSidebarCollapsed ? <FiChevronsRight size={20} /> : <FiChevronsLeft size={20} />} */}
          {isSidebarCollapsed ? ">>" : "<<"}
        </button>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            title={item.name}
            className={`flex items-center p-3 rounded-lg transition-colors group
                        ${pathname.startsWith(item.href) ? 'bg-purple-600 text-white font-semibold shadow-md' : 'text-gray-300 hover:bg-purple-500 hover:text-white'}
                        ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            {item.icon && <item.icon className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${isSidebarCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />}
            {!isSidebarCollapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger Button (usually in Topbar, but here's one way if Sidebar manages it) */}
      <button 
        onClick={toggleMobileMenu} 
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-gray-700/80 backdrop-blur-sm rounded-md text-white hover:bg-gray-600"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? "Close" /*<FiX size={20} />*/ : "Menu" /*<FiMenu size={20} />*/}
      </button>

      {/* Mobile Sidebar (Overlay) */}
      {isMobileMenuOpen && (
         <div className="fixed inset-0 z-30 md:hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={toggleMobileMenu}></div>
            {/* Sidebar Panel */}
            <div className={`relative h-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-64 max-w-[80vw] h-full"> {/* Ensure sidebar content is within this div */}
                    <SidebarContent />
                </div>
            </div>
        </div>
      )}
    </>
  );
}