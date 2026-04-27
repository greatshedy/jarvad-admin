'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users');
      if (response.data.status === 200) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.put(`/update-user/${editingUser._id}`, editingUser);
      if (response.data.status === 200) {
        setEditingUser(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBlockStatus = async (user) => {
    const newStatus = user.status === 'Blocked' ? 'Active' : 'Blocked';
    const confirmMsg = `Are you sure you want to ${newStatus === 'Blocked' ? 'BLOCK' : 'UNBLOCK'} this user?`;
    
    if (confirm(confirmMsg)) {
      try {
        const response = await api.patch(`/toggle-user-block/${user._id}`, { status: newStatus });
        if (response.data.status === 200) {
          await fetchUsers();
        }
      } catch (error) {
        console.error("Error toggling block status:", error);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (confirm(`CRITICAL: Are you sure you want to DELETE user ${user.user_name}? This action cannot be undone.`)) {
      try {
        const response = await api.delete(`/delete-user/${user._id}`);
        if (response.data.status === 200) {
          await fetchUsers();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || (user.status || 'Active') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <Loader message="Loading User Directory..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">User Management</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor and manage access for all registered users.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <input 
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none w-64"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <button 
            onClick={fetchUsers}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {['ALL', 'Active', 'Blocked'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === s 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {filteredUsers.length} Users Found
          </p>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User Identity</th>
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Wallet</th>
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {user.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.user_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <p className="text-sm font-bold text-emerald-600">₦{Number(user.wallet_balance || 0).toLocaleString()}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      (user.status || 'Active') === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' 
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                    }`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                        title="Edit User"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      </button>
                      <button
                        onClick={() => toggleBlockStatus(user)}
                        className={`p-2 rounded-xl transition-all ${
                          user.status === 'Blocked' 
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                            : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                        }`}
                        title={user.status === 'Blocked' ? 'Unblock User' : 'Block User'}
                      >
                        {user.status === 'Blocked' ? (
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        ) : (
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete User"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-zinc-500 dark:text-zinc-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        title="Edit User Profile"
      >
        <form onSubmit={handleUpdateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Full Name</label>
              <input 
                type="text"
                required
                value={editingUser?.user_name || ''}
                onChange={(e) => setEditingUser({...editingUser, user_name: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Address</label>
              <input 
                type="email"
                required
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Wallet Balance (₦)</label>
              <input 
                type="number"
                required
                value={editingUser?.wallet_balance || 0}
                onChange={(e) => setEditingUser({...editingUser, wallet_balance: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button"
              onClick={() => setEditingUser(null)}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:opacity-80 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersView;
