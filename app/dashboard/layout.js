'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { NavigationProvider } from '@/context/NavigationContext';
import Loader from '@/components/Loader';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const adminEmails = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'jarvadgroup.business@gmail.com').split(',').map(e => e.trim().toLowerCase()) : ['jarvadgroup.business@gmail.com']);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('admin_user');
        const storedToken = localStorage.getItem('admin_token');

        if (!storedUser || !storedToken) {
          throw new Error("No session found");
        }

        const parsedUser = JSON.parse(storedUser);
        if (!adminEmails.includes(parsedUser.email.toLowerCase())) {
          throw new Error("Unauthorized email");
        }

        // Session valid
        setIsLoading(false);
      } catch (err) {
        console.warn("Unauthorized access attempt redirected to login:", err.message);
        localStorage.clear();
        window.location.href = '/';
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <Loader fullPage message="Verifying administrative session..." />;
  }

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">J</div>
            <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Jarvad</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
    </NavigationProvider>
  );
}