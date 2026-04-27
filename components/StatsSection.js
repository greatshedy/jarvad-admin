'use client';

import React from 'react';

const StatsSection = ({ stats = null }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 1
    }).format(amount || 0);
  };

  const cards = [
    { 
      label: 'Real Estate Sales', 
      value: formatCurrency(stats?.total_properties_revenue), 
      change: `+${stats?.total_properties_count || 0} Units`, 
      icon: 'sales', 
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' 
    },
    { 
      label: 'Total User Base', 
      value: (stats?.total_users_count || 0).toLocaleString(), 
      change: 'Active Accounts', 
      icon: 'users', 
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' 
    },
    { 
      label: 'Pending Approvals', 
      value: stats?.pending_transactions_count || 0, 
      change: stats?.pending_transactions_count > 0 ? 'Urgent Action' : 'All Clear', 
      icon: 'revenue', 
      color: stats?.pending_transactions_count > 0 
        ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' 
        : 'text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10',
      urgent: stats?.pending_transactions_count > 0
    },
    { 
      label: 'Active Investments', 
      value: stats?.active_plans_count || 0, 
      change: 'JardKidz Plans', 
      icon: 'home', 
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((stat) => (
        <div 
          key={stat.label} 
          className={`p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border ${stat.urgent ? 'border-rose-200 dark:border-rose-900/50 ring-2 ring-rose-500/10' : 'border-zinc-100 dark:border-zinc-800'} flex flex-col justify-between transition-all hover:shadow-md animate-in fade-in duration-500`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {stat.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>}
                {stat.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>}
                {stat.icon === 'sales' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>}
                {stat.icon === 'revenue' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>}
              </svg>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stat.urgent ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/20' : 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800'}`}>
              {stat.change}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</p>
            <h4 className="text-3xl font-black text-zinc-900 dark:text-white mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {stat.value}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSection;
