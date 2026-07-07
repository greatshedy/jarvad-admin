'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';



const ReportsView = () => {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingUser, setBlockingUser] = useState(false);
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

  const fetchUserReports = async () => {
    try {
      setReportsLoading(true);
      const response = await api.get('/reports');
      if (response.data.status === 200) {
        setUserReports(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchUserReports();
  }, []);

  const handleResolveReport = async (reportId, action) => {
    try {
      const response = await api.post(`/resolve-report/${reportId}`, { action });
      if (response.data.status === 200) {
        setUserReports(prev => prev.map(r =>
          r._id === reportId ? { ...r, status: action } : r
        ));
      }
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedReport || !warningMessage.trim()) return;
    try {
      setSendingWarning(true);
      const response = await api.post('/send-warning', {
        user_id: selectedReport.vendor_id,
        message: warningMessage.trim(),
      });
      if (response.data.status === 200) {
        alert('Warning sent successfully');
        setShowWarningModal(false);
        setWarningMessage('');
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Error sending warning:", error);
      alert('Failed to send warning');
    } finally {
      setSendingWarning(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedReport || !blockReason.trim()) return;
    try {
      setBlockingUser(true);
      const response = await api.patch(`/toggle-user-block/${selectedReport.vendor_id}`, {
        status: 'Blocked',
        reason: blockReason.trim(),
      });
      if (response.data.status === 200) {
        alert('User blocked successfully');
        setShowBlockModal(false);
        setBlockReason('');
        setSelectedReport(null);
        handleResolveReport(selectedReport._id, 'resolved');
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert('Failed to block user');
    } finally {
      setBlockingUser(false);
    }
  };

  const handleUnblockUser = async (vendorId, reportId) => {
    try {
      const response = await api.patch(`/toggle-user-block/${vendorId}`, {
        status: 'Active',
      });
      if (response.data.status === 200) {
        alert('User unblocked successfully');
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert('Failed to unblock user');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  if (isLoading) return <Loader message="Generating Intelligence Reports..." />;
  if (!data) return <div className="p-10 text-center">Failed to load reports.</div>;

  const formatCurrency = (val) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-all ${
            activeTab === 'intelligence'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Intelligence Reports
        </button>
        <button
          onClick={() => { setActiveTab('users'); fetchUserReports(); }}
          className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          User Reports {userReports.length > 0 && `(${userReports.length})`}
        </button>
      </div>

      {activeTab === 'intelligence' ? (<>

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
      </>) : null}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">User Reports</h2>
            <div className="flex gap-2">
              <button
                onClick={fetchUserReports}
                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-sm hover:opacity-90 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {reportsLoading ? (
            <Loader message="Loading reports..." />
          ) : userReports.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-bold text-lg">No reports yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/30">
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reporter</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vendor ID</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reason</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Details</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {userReports.map((report) => (
                      <tr key={report._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all">
                        <td className="p-4">
                          <div className="font-bold text-zinc-900 dark:text-white">{report.reporter?.name || 'Unknown'}</div>
                          {report.reporter?.email && (
                            <div className="text-xs text-zinc-500">{report.reporter.email}</div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">{report.vendor_id?.slice(0, 12)}...</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {report.reason}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                          {report.custom_reason || '-'}
                        </td>
                        <td className="p-4 text-sm text-zinc-500">{formatDate(report.created_at)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setWarningMessage('');
                                    setShowWarningModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-all"
                                >
                                  Warn
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setBlockReason('');
                                    setShowBlockModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all"
                                >
                                  Block
                                </button>
                                <button
                                  onClick={() => handleResolveReport(report._id, 'dismissed')}
                                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleUnblockUser(report.vendor_id, report._id)}
                              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all"
                            >
                              Unblock
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Send Warning</h3>
            <textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="Enter warning message..."
              rows={4}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm bg-transparent text-zinc-900 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                disabled={sendingWarning || !warningMessage.trim()}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
              >
                {sendingWarning ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Block User</h3>
            <p className="text-sm text-zinc-500 mb-4">This will restrict the user from accessing the app.</p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for blocking..."
              rows={3}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm bg-transparent text-zinc-900 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                disabled={blockingUser || !blockReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
              >
                {blockingUser ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
