'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const FinanceView = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(''); // New search state
  const [processingId, setProcessingId] = useState(null);
  const [proofUrl, setProofUrl] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
    page_size: 15
  });

  const fetchData = async (page = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [summaryRes, transactionsRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get(`/finance/transactions?page=${page}&page_size=15`)
      ]);

      if (summaryRes.data.status === 200) {
        setSummary(summaryRes.data.data);
      }
      
      if (transactionsRes.data.status === 200) {
        setTransactions(transactionsRes.data.data);
        if (transactionsRes.data.pagination) {
          setPagination(transactionsRes.data.pagination);
        }
      } else {
        setError(transactionsRes.data.message || "Failed to load transactions.");
      }
    } catch (error) {
      console.error("Error fetching finance data:", error);
      setError("Unable to connect to financial services. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleAction = async (txRef, action) => {
    if (action === 'delete' && !confirm('Are you sure you want to permanently delete this transaction record?')) return;
    
    setProcessingId(txRef);
    try {
      let endpoint = '';

      if (action === 'approve') endpoint = `/finance/approve-transaction/${txRef}`;
      else if (action === 'decline') endpoint = `/finance/decline-transaction/${txRef}`;
      else if (action === 'processing') endpoint = `/finance/processing-transaction/${txRef}`;

      const response = await api.post(endpoint);
      if (response.data.status === 200) {
        await fetchData(currentPage);
      } else {
        alert(response.data.message || 'Action failed');
      }
    } catch (error) {
      console.error(`Error performing ${action} on ${txRef}:`, error);
      alert('An error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethod = (tx) => {
    const gateway = tx.gateway || 'Unknown';
    if (tx.is_manual) return 'Manual Bank Transfer';
    if (gateway.toLowerCase() === 'bank transfer') return 'Direct Bank Transfer';
    if (['flutterwave', 'monnify', 'paystack'].includes(gateway.toLowerCase())) return 'Gateway';
    if (gateway.toLowerCase() === 'card') return 'Card';
    if (gateway.toLowerCase() === 'wallet') return 'Wallet Balance';
    return gateway;
  };

  const filteredTransactions = transactions.filter(tx => {
    // Status Filter
    const matchesStatus = filter === 'ALL' || tx.status === filter;
    
    // Search Filter (Name or Transaction ID)
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      tx.user_name?.toLowerCase().includes(query) || 
      tx.tx_ref?.toLowerCase().includes(query) ||
      tx.user_email?.toLowerCase().includes(query);
    
    return matchesStatus && matchesSearch;
  });

  if (isLoading) return <Loader message="Loading Financial Data..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Service Error</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">{error}</p>
        <button 
          onClick={() => fetchData(currentPage)}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Financial Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor revenue, transactions and liquidity.</p>
        </div>
        <button 
          onClick={() => fetchData(currentPage)}
          className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <FinanceCard 
          title="Property Revenue" 
          value={formatCurrency(summary?.total_properties_revenue || 0)} 
          subtitle={`${summary?.total_properties_count || 0} Properties Sold`}
          icon="trending-up"
          trend="+12.5%"
          color="indigo"
        />
        <FinanceCard 
          title="Wallet Liabilities" 
          value={formatCurrency(summary?.total_wallet_balance || 0)} 
          subtitle="Customer Funds in Escrow"
          icon="wallet"
          color="amber"
        />
        <FinanceCard 
          title="Transactions" 
          value={pagination.total_count} 
          subtitle="All types (Total)"
          icon="switch-horizontal"
          color="emerald"
        />
        <FinanceCard 
          title="Users" 
          value={summary?.total_users_count || 0} 
          subtitle="Total User Base"
          icon="users"
          color="zinc"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-10">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Transactions</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH FILTER */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-rose-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-x-auto thin-scrollbar w-full sm:w-auto">
              {['ALL', 'SUCCESS', 'PENDING', 'PROCESSING', 'FAILED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    filter === s 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">User / Reference</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Method</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Purpose</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Amount</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400 text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.user_name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-tight">{tx.user_email}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{tx.tx_ref}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                        {getPaymentMethod(tx)}
                      </p>
                      {tx.is_manual && (
                        <span className="inline-flex w-fit px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase">Manual</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tx.type === 'DEBIT' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize">{tx.purpose || 'Wallet Top-up'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className={`text-sm font-bold ${tx.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      tx.status === 'SUCCESS' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' 
                        : tx.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                          : tx.status === 'PROCESSING'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      {tx.proof_url && (
                        <button
                          onClick={() => setProofUrl(tx.proof_url)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          View Proof
                        </button>
                      )}
                      
                      {tx.status !== 'SUCCESS' && tx.status !== 'FAILED' && (
                        <>
                          <button
                            disabled={processingId === tx.tx_ref}
                            onClick={() => handleAction(tx.tx_ref, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20"
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingId === tx.tx_ref}
                            onClick={() => handleAction(tx.tx_ref, 'processing')}
                            className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Processing
                          </button>
                          <button
                            disabled={processingId === tx.tx_ref}
                            onClick={() => handleAction(tx.tx_ref, 'decline')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-zinc-500 dark:text-zinc-400 italic font-medium">
                    No transactions match your current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Showing <span className="text-zinc-900 dark:text-white">{filteredTransactions.length}</span> of <span className="text-zinc-900 dark:text-white">{pagination.total_count}</span> transactions
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button
              disabled={currentPage === pagination.total_pages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Proof Modal */}
      <Modal 
        isOpen={!!proofUrl} 
        onClose={() => setProofUrl(null)}
        title="Payment Proof Verification"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center min-h-[400px]">
            <img 
              src={proofUrl} 
              alt="Payment Proof" 
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Proof+Image+Not+Found'; }}
            />
          </div>
          <p className="text-zinc-500 text-sm text-center italic">Verify the details on this receipt before approving the transaction.</p>
          <button 
            onClick={() => setProofUrl(null)}
            className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl transition-all active:scale-95 shadow-xl"
          >
            Close Preview
          </button>
        </div>
      </Modal>
    </div>
  );
};

const FinanceCard = ({ title, value, subtitle, icon, trend, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600',
    zinc: 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          {icon === 'trending-up' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6"></path></svg>}
          {icon === 'wallet' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>}
          {icon === 'switch-horizontal' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>}
          {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
        </div>
      </div>
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{value}</h3>
      <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mt-1 font-medium">{subtitle}</p>
    </div>
  );
};

export default FinanceView;
