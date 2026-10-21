'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import Modal from './Modal';

const COUNT_LABELS = [
  ['portfolio', 'Portfolio / investments'],
  ['transactions', 'Transactions'],
  ['orders', 'Orders'],
  ['reviews', 'Reviews'],
  ['partners', 'Partner records'],
  ['vendors', 'Vendor records'],
  ['jard_kidz', 'Child plans'],
  ['notifications', 'Notifications'],
  ['housing_subscriptions', 'Housing subscriptions'],
  ['distributors', 'Distributor registrations'],
  ['withdraw_requests', 'Withdrawal requests'],
  ['deletion_requests', 'Deletion requests'],
  ['kids_profiles', 'Child profiles'],
  ['land_purchases', 'Land purchases'],
  ['land_payments', 'Land payments'],
  ['land_referral_relationships', 'Land referral relationships'],
  ['referral_activities', 'Referral activities'],
  ['referral_commissions', 'Referral commissions'],
  ['reports', 'Reports'],
  ['support_messages', 'Support messages'],
  ['referred_users', 'Users referred by this account'],
  ['assets', 'Uploaded images/assets'],
];

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const DeleteUserModal = ({ isOpen, onClose, user, onDeleted, onConfirm }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('full');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?._id) return;
    setPreview(null);
    setError(null);
    setMode('full');
    setConfirmation('');
    const fetchPreview = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/users/${user._id}/deletion-preview`);
        if (response.data.status === 200) {
          setPreview(response.data.data);
        } else {
          setError(response.data.message || 'Could not load deletion details.');
        }
      } catch (err) {
        console.error('Error loading deletion preview:', err);
        setError(err.response?.data?.message || 'Could not load deletion details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreview();
  }, [isOpen, user?._id]);

  const requiredConfirmation = preview?.confirmation || `DELETE ${user?.email || ''}`;
  const counts = useMemo(() => preview?.counts || {}, [preview]);
  const fullDeleteSelected = mode === 'full';
  const confirmationMatches = confirmation.trim() === requiredConfirmation;

  const visibleCounts = useMemo(
    () => COUNT_LABELS.filter(([key]) => Number(counts[key] || 0) > 0),
    [counts]
  );

  const handleDelete = async () => {
    if (!confirmationMatches || !preview) return;
    setIsDeleting(true);
    setError(null);
    try {
      if (onConfirm) {
        await onConfirm({ mode, confirmation: confirmation.trim() });
        onClose();
        return;
      }
      const response = await api.delete(`/delete-user/${user._id}`, {
        data: { mode, confirmation: confirmation.trim() },
      });
      if (response.data.status === 200) {
        if (onDeleted) onDeleted(response.data);
        onClose();
      } else {
        setError(response.data.message || 'Deletion failed.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Deletion failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => !isDeleting && onClose()} title="Delete User">
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-5">
          <p className="text-lg font-black text-zinc-900 dark:text-white">
            {user?.user_name || preview?.user?.user_name || 'Unknown user'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user?.email}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              Wallet: <strong className="text-zinc-900 dark:text-white">{formatMoney(preview?.user?.wallet_balance ?? user?.wallet_balance)}</strong>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Earnings: <strong className="text-zinc-900 dark:text-white">{formatMoney(preview?.user?.earnings_balance)}</strong>
            </span>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading deletion impact...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                1. Choose what to delete
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('user_only')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${
                    mode === 'user_only'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <p className="font-black text-zinc-900 dark:text-white">User account only</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-5">
                    Removes only the login and profile. Orders, transactions, portfolio, referrals, partner/vendor records and other data stay behind as orphaned records.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('full')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${
                    mode === 'full'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <p className="font-black text-zinc-900 dark:text-white">User and everything related</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-5">
                    Permanently deletes all related records, wallet history, investments, referrals, partner/vendor data and uploaded images.
                  </p>
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${fullDeleteSelected ? 'border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-900' : 'border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider mb-3 ${fullDeleteSelected ? 'text-rose-600' : 'text-amber-600'}`}>
                {fullDeleteSelected ? 'Permanent deletion impact' : 'Orphaned data warning'}
              </h3>
              {fullDeleteSelected ? (
                <ul className="text-sm leading-6 text-rose-700 dark:text-rose-300 list-disc pl-5 space-y-1">
                  <li>Wallet balance and all financial history will be deleted.</li>
                  <li>Orders, investments, housing subscriptions, child plans and referrals will be deleted.</li>
                  <li>Partner/vendor records and uploaded Cloudinary images will be deleted.</li>
                  <li>Other users referred by this account will have their referral link cleared.</li>
                  <li>This action cannot be undone.</li>
                </ul>
              ) : (
                <ul className="text-sm leading-6 text-amber-700 dark:text-amber-300 list-disc pl-5 space-y-1">
                  <li>The user will disappear from the user list.</li>
                  <li>All related records will remain in the database without a user account.</li>
                  <li>This is not recommended if you want a clean deletion.</li>
                  <li>The user may register again with the same email.</li>
                </ul>
              )}
              {visibleCounts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
                  {visibleCounts.map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                      <span className="font-black text-zinc-900 dark:text-white">{counts[key]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                2. Type to confirm
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Type exactly:
                <span className="block mt-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-rose-600 select-all">
                  {requiredConfirmation}
                </span>
              </p>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={requiredConfirmation}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!confirmationMatches || isDeleting}
                className={`flex-1 px-5 py-3 rounded-xl font-bold text-white transition-all ${
                  confirmationMatches && !isDeleting
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting...' : fullDeleteSelected ? 'Delete user and all data' : 'Delete user account'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
