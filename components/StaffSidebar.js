'use client';

import React from 'react';

const ICONS = {
  estates: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
  ),
  products: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
  ),
  support: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636A9 9 0 105.636 18.364M12 8v4m0 4h.01"></path>
  ),
  password: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
  ),
};

const ITEMS = [
  { view: 'estates', title: 'Estates', permission: 'estates.manage', icon: 'estates' },
  { view: 'products', title: 'Shop Products', permission: 'products.manage', icon: 'products' },
  { view: 'support', title: 'Support Settings', permission: 'settings.support', icon: 'support' },
  { view: 'change-password', title: 'Change Password', permission: null, icon: 'password' },
];

const StaffSidebar = ({ activeView, onSelect, permissions = [], staffUser = {}, onLogout }) => {
  const allowed = ITEMS.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex flex-col">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
            J
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Staff</h1>
            <p className="text-[11px] font-semibold text-zinc-400 truncate max-w-[170px]">
              {staffUser.email || 'Staff account'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {allowed.map((item) => (
          <button
            key={item.view}
            onClick={() => onSelect(item.view)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeView === item.view
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {ICONS[item.icon]}
            </svg>
            {item.title}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;
