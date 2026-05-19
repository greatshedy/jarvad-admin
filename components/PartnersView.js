'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const PartnersView = () => {
  const [activeTab, setActiveTab] = useState('partner'); // 'vendor' or 'partner'
  const [data, setData] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchData = async () => {
    try {
      setIsFetching(true);
      const response = await api.get(`/partners-list?type=${activeTab}`);
      console.log(`[PARTNERS] Fetched ${activeTab}s:`, response.data);
      if (response.data.status === 200) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleVerify = async (id, currentStatus) => {
    const newStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
    try {
      const response = await api.patch(`/verify-account/${id}`, {
        type: activeTab,
        status: newStatus
      });
      if (response.data.status === 200) {
        setData(data.map(item => item._id === id ? { ...item, status: newStatus } : item));
      }
    } catch (error) {
      console.error("Error verifying account:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account record?')) {
      try {
        const response = await api.delete(`/delete-account/${id}?type=${activeTab}`);
        if (response.data.status === 200) {
          setData(data.filter(item => item._id !== id));
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  if (isFetching && data.length === 0) return <Loader message={`Loading ${activeTab}s...`} />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white capitalize">{activeTab} Management</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and verify platform {activeTab}s.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
          <button 
            onClick={() => setActiveTab('vendor')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'vendor' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Vendors
          </button>
          <button 
            onClick={() => setActiveTab('partner')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'partner' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Partners
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-50 dark:border-zinc-800">
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase">User</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase">Category / Type</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase">Status</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase">Joined</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {data.map((item) => (
                <tr key={item._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-100 dark:border-zinc-700">
                        <img src={item.photo || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="Profile" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {item.user_info?.user_name || item.fullName || item.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {item.user_info?.email || item.email || 'No Email'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      {item.skills || item.vocation || item.business_type || item.partner_type || 'General Partner'}
                    </span>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{item.bankName || 'Individual'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'verified' 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' 
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setSelectedAccount(item)}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-600 rounded-xl transition-all"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleVerify(item._id, item.status)}
                        className={`p-2 rounded-xl transition-all ${item.status === 'verified' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-emerald-500'}`}
                        title={item.status === 'verified' ? 'Unverify' : 'Verify'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500 rounded-xl transition-all"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No {activeTab}s found.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal 
        isOpen={!!selectedAccount} 
        onClose={() => setSelectedAccount(null)}
        title={`${activeTab === 'vendor' ? 'Vendor' : 'Partner'} Details`}
      >
        {selectedAccount && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[32px]">
              <div className="w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl flex-shrink-0">
                <img src={selectedAccount.photo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                  {selectedAccount.fullName || selectedAccount.business_name || 'N/A'}
                </h3>
                <p className="text-indigo-600 font-bold text-sm mt-1">{selectedAccount.email}</p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="px-2 py-1 bg-white dark:bg-zinc-700 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-100 dark:border-zinc-600">
                     ID: {selectedAccount._id.slice(-6).toUpperCase()}
                   </span>
                   <span className="text-xs text-zinc-400 font-bold">{selectedAccount.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  {selectedAccount.skills ? 'Expertise / Skills' : 'Vocation'}
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {selectedAccount.skills || selectedAccount.vocation || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Business Address</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedAccount.address || 'N/A'}</p>
              </div>
            </div>

            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100/50 dark:border-indigo-500/10">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Bank Settlement Info</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-zinc-400">Account Number</p>
                  <p className="text-lg font-black text-zinc-900 dark:text-white tracking-wider">{selectedAccount.accountNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400">Bank Name</p>
                  <p className="text-sm font-black text-indigo-600">{selectedAccount.bankName || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Registration Certificate</p>
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 group">
                <img src={selectedAccount.certificate} className="w-full h-full object-contain" alt="Certificate" />
                <a 
                  href={selectedAccount.certificate} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="px-6 py-2 bg-white text-zinc-900 font-bold rounded-xl shadow-xl">View Original</span>
                </a>
              </div>
            </div>

            <button 
              onClick={() => setSelectedAccount(null)}
              className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl shadow-xl transition-all active:scale-95 hover:opacity-90"
            >
              Close Record
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PartnersView;
