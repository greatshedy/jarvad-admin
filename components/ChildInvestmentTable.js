'use client';

import React from 'react';

const ChildInvestmentTable = ({ investments, onEdit, onDelete, onChangeStatus }) => {
  
  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    try {
      // Expected format: "17--Apr--2021" or "DD--Mon--YYYY"
      const parts = dobString.split('--');
      if (parts.length !== 3) return 'N/A';
      
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      
      const dob = new Date(year, months[monthStr], day);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      console.error("Age calculation error:", e);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Active Child Investments</h3>
        <span className="text-xs font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg">
          {investments.length} Active Plans
        </span>
      </div>

      <div className="overflow-x-auto thin-scrollbar">
        <table className="min-w-[1000px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Child Name</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Plan / Age</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paid</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Remaining</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Duration / %</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {investments.map((item) => {
              const amountPaid = (item.monthly_amount || 0) * (item.months_paid || 0);
              const totalAmount = (item.monthly_amount || 0) * (item.total_months || 0);
              const amountRemaining = totalAmount - amountPaid;
              const age = calculateAge(item.child_dob);

              return (
                <tr key={item._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.child_name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">JardKidz Savings</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{age} Years Old</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(amountPaid)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.months_paid} Months</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(amountRemaining)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total: {formatCurrency(totalAmount)}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-zinc-900 dark:text-white">{item.investment_period_years} Years</p>
                    <p className="text-xs text-emerald-500 font-bold">+{item.return_percentage}% Return</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' 
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-1 sm:gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onEdit(item._id)}
                        className="p-1.5 sm:p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => onChangeStatus(item._id)}
                        className="p-1.5 sm:p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                        title="Change Status"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="p-1.5 sm:p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChildInvestmentTable;
