'use client';

import React, { useState } from 'react';
import { staffApi } from '@/staffApi';

const StaffChangePassword = ({ forced = false, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await staffApi.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (response.data.status === 200) {
        setNotice('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        localStorage.setItem('staff_must_change', 'false');
        if (onSuccess) onSuccess();
      } else {
        setError(response.data.message || 'Unable to update password.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {forced ? 'Set a New Password' : 'Change Password'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {forced
            ? 'Your account was created with a temporary password. Please choose a new password to continue.'
            : 'Update the password you use to sign into the staff portal.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-zinc-400 mt-2">At least 8 characters.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-60"
        >
          {isSaving ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default StaffChangePassword;
