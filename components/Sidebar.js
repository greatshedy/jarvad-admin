'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { activeView, setActiveView } = useNavigation();
  const [adminUser, setAdminUser] = useState({
    name: 'Admin User',
    email: 'admin@jarvad.com',
    picture: ''
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        setAdminUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load user details in sidebar:", e);
    }
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of the admin panel?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', view: 'dashboard' },
    { 
      name: 'Product', 
      icon: 'home', 
      isGroup: true,
      subItems: [
        { name: 'Estate', view: 'estates' },
        { name: 'Bulk Upload', view: 'bulk-estate-upload' },
        { name: 'Child Investment', view: 'child-investments' }
      ]
    },
    { 
      name: 'Shop', 
      icon: 'shopping-bag', 
      isGroup: true,
      subItems: [
        { name: 'Products', view: 'jardproc' },
        { name: 'Orders', view: 'jardproc-orders' }
      ]
    },
    { name: 'Partners', icon: 'users', view: 'partners' },
    { name: 'Users', icon: 'user-group', view: 'users' },
    { name: 'Finance', icon: 'banknotes', view: 'finance' },
    { name: 'Withdrawals', icon: 'withdraw', view: 'withdrawals' },
    { name: 'Reports', icon: 'chart-bar', view: 'reports' },
    { name: 'Settings', icon: 'cog', view: 'settings' },
  ];

  const [expandedGroups, setExpandedGroups] = React.useState(['Product']);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => 
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 w-[280px] z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">J</div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Jarvad</h1>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <div key={item.name} className="space-y-1">
                {item.isGroup ? (
                  <>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all group ${
                        item.subItems.some(sub => sub.view === activeView)
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`transition-colors ${item.subItems.some(sub => sub.view === activeView) ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-indigo-500'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {item.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>}
                            {item.icon === 'shopping-bag' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>}
                          </svg>
                        </div>
                        <span>{item.name}</span>
                      </div>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${expandedGroups.includes(item.name) ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {expandedGroups.includes(item.name) && (
                      <div className="ml-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.subItems.map((sub) => (
                          <button
                            key={sub.view}
                            onClick={() => {
                              setActiveView(sub.view);
                              if (onClose) onClose();
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              activeView === sub.view 
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeView === sub.view ? 'bg-indigo-600' : 'bg-transparent border border-zinc-400'}`}></div>
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setActiveView(item.view);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${
                      activeView === item.view 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-white/10' 
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`transition-colors ${activeView === item.view ? 'text-current' : 'text-zinc-400 group-hover:text-indigo-500'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon === 'dashboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>}
                        {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>}
                        {item.icon === 'user-group' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M17 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>}
                        {item.icon === 'chart-bar' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>}
                        {item.icon === 'banknotes' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>}
                        {item.icon === 'withdraw' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16M4 16l5-5 4 4 7-7M14 8h6v6"></path>}
                        {item.icon === 'cog' && (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </>
                        )}
                      </svg>
                    </div>
                    <span>{item.name}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-8 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              {adminUser.picture ? (
                <img 
                  src={adminUser.picture} 
                  alt={adminUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-zinc-300 dark:border-zinc-700 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {adminUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{adminUser.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{adminUser.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-zinc-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-10V7a3 3 0 00-6 0v1"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
