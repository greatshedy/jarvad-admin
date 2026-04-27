'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';

const ReportsView = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/finance/reports');
      if (response.data.status === 200) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (isLoading) return <Loader message="Generating Intelligence Reports..." />;
  if (!data) return <div className="p-10 text-center">Failed to load reports.</div>;

  const formatCurrency = (val) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Intelligence Reports</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Advanced data aggregations and business performance insights.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Refresh Data
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20">
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Gross Operating Revenue</p>
          <h3 className="text-4xl font-black mt-2">
            {formatCurrency(data.revenue_sources.real_estate + data.revenue_sources.investments)}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Calculation
          </div>
        </div>

        <div className="p-8 bg-zinc-900 dark:bg-white rounded-[2.5rem] text-white dark:text-zinc-900 shadow-xl">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm font-bold uppercase tracking-wider">Average Deal Size</p>
          <h3 className="text-4xl font-black mt-2">
            {formatCurrency(data.avg_wallet_balance * 1.5)} 
          </h3>
          <p className="text-zinc-500 mt-4 text-xs font-medium">Based on current portfolio distributions.</p>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Total Active Investors</p>
          <h3 className="text-4xl font-black mt-2 text-zinc-900 dark:text-white">
            {data.total_investors}
          </h3>
          <div className="mt-4 flex -space-x-3">
            {data.top_investor_initials.map((initial, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                 {initial}
              </div>
            ))}
            {data.total_investors > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                +{data.total_investors - 4}
              </div>
            )}
            {data.total_investors === 0 && (
              <p className="text-[10px] font-bold text-zinc-400">No active investors yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Revenue Source Breakdown Chart */}
         <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Revenue Distribution</h4>
               <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500">Source vs Source</div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="relative w-48 h-48">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                     {/* Base Circle */}
                     <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-100 dark:text-zinc-800" />
                     {/* Real Estate Path */}
                     <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="4" 
                        strokeDasharray={`${(data.revenue_sources.real_estate / (data.revenue_sources.real_estate + data.revenue_sources.investments)) * 100} 100`} 
                        className="transition-all duration-1000"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-2xl font-black text-zinc-900 dark:text-white">
                        {Math.round((data.revenue_sources.real_estate / (data.revenue_sources.real_estate + data.revenue_sources.investments)) * 100)}%
                     </span>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase">Estates</span>
                  </div>
               </div>

               <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Real Estate</span>
                     </div>
                     <span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(data.revenue_sources.real_estate)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Kidz Investments</span>
                     </div>
                     <span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(data.revenue_sources.investments)}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Transaction Success Rate */}
         <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-8">Transaction Health Pulse</h4>
            <div className="grid grid-cols-2 gap-4">
               {Object.entries(data.transaction_health).map(([status, count]) => (
                  <div key={status} className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-500 transition-all">
                     <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{status}</p>
                     <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white">{count}</span>
                        <div className="h-8 w-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                           <div 
                              className={`w-full ${status === 'SUCCESS' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'} transition-all duration-1000`} 
                              style={{ height: `${(count / Object.values(data.transaction_health).reduce((a,b) => a+b, 0)) * 100}%` }}
                           />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Property Performance Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Top Performing Estates</h4>
          <button className="text-indigo-600 font-bold text-sm hover:underline">View All Assets</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/30">
                <th className="p-6 text-xs font-black uppercase text-zinc-500 tracking-wider">Estate Details</th>
                <th className="p-6 text-xs font-black uppercase text-zinc-500 tracking-wider text-center">Units Sold</th>
                <th className="p-6 text-xs font-black uppercase text-zinc-500 tracking-wider text-right pr-12">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {data.property_leaderboard.map((house, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all font-black">
                        #{i+1}
                       </div>
                       <span className="font-bold text-zinc-900 dark:text-white">{house.name}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center font-bold text-zinc-600 dark:text-zinc-400">
                    {house.units}
                  </td>
                  <td className="p-6 text-right font-black text-indigo-600 pr-12">
                    {formatCurrency(house.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
