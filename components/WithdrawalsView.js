'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const STATUS_META = {
  pending_otp: { label: 'Awaiting OTP', cls: 'bg-zinc-100 dark:bg-zinc-700/40 text-zinc-600 dark:text-zinc-300' },
  pending_admin: { label: 'Pending', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
  paid: { label: 'Paid', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' },
};

const WithdrawalsView = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/finance/withdraw-requests');
      if (response.data.status === 200) {
        setRequests(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load withdraw requests.');
      }
    } catch (error) {
      console.error('Error fetching withdraw requests:', error);
      setError('Unable to connect to financial services. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (withdrawId, action) => {
    const record = requests.find((r) => r.id === withdrawId);
    const label = action === 'approve' ? 'approve' : 'reject';
    const amount = record ? `₦${Number(record.amount).toLocaleString()}` : '';
    if (!confirm(`Are you sure you want to ${label} this withdraw request of ${amount}?`)) return;

    setProcessingId(withdrawId);
    try {
      const response = await api.post(`/finance/withdraw-requests/${withdrawId}/${action}`);
      if (response.data.status === 200) {
        await fetchData();
      } else {
        alert(response.data.message || 'Action failed');
      }
    } catch (error) {
      console.error(`Error performing ${action} on ${withdrawId}:`, error);
      alert('An error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filter === 'ALL' || req.state === filter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      req.user_name?.toLowerCase().includes(query) ||
      req.user_email?.toLowerCase().includes(query) ||
      req.bank_name?.toLowerCase().includes(query) ||
      String(req.account_number || '').includes(query);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.state === 'pending_admin').length;

  if (isLoading) return <Loader message="Loading Withdraw Requests..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Service Error</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Withdraw Requests</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Approve or reject user earnings withdrawals.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-xs font-bold rounded-xl">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={() => fetchData()}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-10">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">All Requests</h3>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search user or bank..."
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

            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-x-auto thin-scrollbar w-full sm:w-auto">
              {['ALL', 'pending_admin', 'paid', 'rejected', 'pending_otp'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    filter === s
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {s === 'ALL' ? 'All' : STATUS_META[s]?.label || s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">User</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Amount</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Bank</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">Requested</th>
                <th className="p-4 text-sm font-bold text-zinc-500 dark:text-zinc-400 text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredRequests.map((req) => {
                const meta = STATUS_META[req.state] || STATUS_META.pending_otp;
                return (
                  <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                    <td className="p-4">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{req.user_name}</p>
                      <p className="text-[10px] text-zinc-400">{req.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(req.amount)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{req.bank_name || '—'}</p>
                      <p className="text-[10px] text-zinc-400">{req.account_name || ''}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{req.account_number || ''}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(req.created_at)}</p>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelected(req)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          Details
                        </button>
                        {req.state === 'pending_admin' && (
                          <>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleAction(req.id, 'approve')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleAction(req.id, 'reject')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-zinc-500 dark:text-zinc-400 italic font-medium">
                    No withdraw requests match your current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Withdraw Request Details">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="User" value={selected.user_name} />
              <DetailField label="Email" value={selected.user_email || '—'} />
              <DetailField label="Amount" value={formatCurrency(selected.amount)} highlight />
              <DetailField
                label="Status"
                value={STATUS_META[selected.state]?.label || selected.state}
                badge={STATUS_META[selected.state]?.cls}
              />
              <DetailField label="Bank Name" value={selected.bank_name || '—'} />
              <DetailField label="Account Number" value={selected.account_number || '—'} />
              <DetailField label="Account Name" value={selected.account_name || '—'} />
              <DetailField label="Requested At" value={formatDate(selected.created_at)} />
              <DetailField label="Verified At" value={formatDate(selected.verified_at)} />
            </div>

            {selected.state === 'pending_admin' && (
              <div className="flex gap-3 pt-2">
                <button
                  disabled={processingId === selected.id}
                  onClick={() => { handleAction(selected.id, 'approve'); }}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                >
                  Approve &amp; Pay Out
                </button>
                <button
                  disabled={processingId === selected.id}
                  onClick={() => { handleAction(selected.id, 'reject'); }}
                  className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                >
                  Reject &amp; Refund
                </button>
              </div>
            )}
            <p className="text-xs text-zinc-400 italic">
              Rejecting refunds the amount back to the user&apos;s wallet. Approving marks the request as paid.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailField = ({ label, value, highlight, badge }) => (
  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
    {badge ? (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge}`}>
        {value}
      </span>
    ) : (
      <p className={`text-sm font-bold ${highlight ? 'text-emerald-600 text-lg' : 'text-zinc-900 dark:text-white'}`}>
        {value}
      </p>
    )}
  </div>
);

export default WithdrawalsView;
