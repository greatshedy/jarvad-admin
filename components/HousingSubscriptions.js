'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import Loader from './Loader';

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const HousingSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [promoFilter, setPromoFilter] = useState('All');

  const fetchSubscriptions = async () => {
    try {
      setIsFetching(true);
      const response = await api.get('/housing-subscriptions');
      if (response.data.status === 200) {
        setSubscriptions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching housing subscriptions:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (statusFilter !== 'All' && sub.status !== statusFilter) return false;
      const hasPromo = Boolean(sub.promo_snapshot?.label || sub.promo_snapshot?.discount_type);
      if (promoFilter === 'Promo' && !hasPromo) return false;
      if (promoFilter === 'No Promo' && hasPromo) return false;
      if (!term) return true;
      return [
        sub.subscription_id,
        sub.user_info?.user_name,
        sub.user_info?.email,
        sub.estate_info?.house_name,
        sub.unit_type_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [subscriptions, search, statusFilter, promoFilter]);

  const stats = useMemo(() => {
    const totalSaved = subscriptions.reduce((sum, sub) => sum + Number(sub.total_saved || 0), 0);
    const totalFees = subscriptions.reduce((sum, sub) => sum + Number(sub.registration_fee_paid || 0), 0);
    const active = subscriptions.filter((sub) => sub.status === 'Active').length;
    const promoLocked = subscriptions.filter(
      (sub) => sub.promo_snapshot?.label || sub.promo_snapshot?.discount_type
    ).length;
    return { totalSaved, totalFees, active, promoLocked };
  }, [subscriptions]);

  const updateStatus = async (subscriptionId, status) => {
    try {
      const response = await api.patch(`/housing-subscriptions/${subscriptionId}/status`, { status });
      if (response.data.status === 200) {
        setSubscriptions((prev) =>
          prev.map((sub) => (sub.subscription_id === subscriptionId ? { ...sub, status } : sub))
        );
      }
    } catch (error) {
      console.error('Error updating housing subscription:', error);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Subscription ID',
      'User',
      'Email',
      'Estate',
      'Unit Type',
      'Locked Price',
      'Registration Fee',
      'Total Saved',
      'Access Limit',
      'Promo',
      'Status',
      'Created',
    ];
    const rows = filtered.map((sub) => [
      sub.subscription_id,
      sub.user_info?.user_name || '',
      sub.user_info?.email || '',
      sub.estate_info?.house_name || '',
      sub.unit_type_name || '',
      sub.locked_unit_price || 0,
      sub.registration_fee_paid || 0,
      sub.total_saved || 0,
      sub.access_limit || 0,
      sub.promo_snapshot?.label || '',
      sub.status || '',
      sub.created_at || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'housing-subscriptions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isFetching) return <Loader message="Loading housing subscriptions..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Housing Subscriptions
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Track savings, registration fees, promo locks and access limits.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="px-5 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Subscriptions', value: subscriptions.length },
          { label: 'Active', value: stats.active },
          { label: 'Total Saved', value: formatMoney(stats.totalSaved) },
          { label: 'Fees Collected', value: formatMoney(stats.totalFees) },
          { label: 'Promo Locked', value: stats.promoLocked },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{stat.label}</p>
            <p className="text-xl font-black text-zinc-900 dark:text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user, estate, unit or ID..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Suspended">Suspended</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={promoFilter}
          onChange={(e) => setPromoFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
        >
          <option value="All">All Promo States</option>
          <option value="Promo">Promo Locked</option>
          <option value="No Promo">No Promo</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {['Subscription', 'User', 'Estate / Unit', 'Pricing', 'Saved', 'Access', 'Promo', 'Status'].map((header) => (
                  <th key={header} className="px-5 py-5 text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((sub) => (
                <tr key={sub._id || sub.subscription_id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-5">
                    <p className="font-mono font-bold text-sm text-zinc-900 dark:text-white">{sub.subscription_id}</p>
                    <p className="text-xs text-zinc-400 mt-1">{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-'}</p>
                  </td>
                  <td className="px-5 py-5">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{sub.user_info?.user_name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-400 mt-1">{sub.user_info?.email || 'N/A'}</p>
                    <p className="text-xs text-zinc-400">{sub.user_info?.phone_number || ''}</p>
                  </td>
                  <td className="px-5 py-5">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{sub.estate_info?.house_name || '-'}</p>
                    <p className="text-xs text-indigo-500 font-semibold mt-1">{sub.unit_type_name || '-'}</p>
                  </td>
                  <td className="px-5 py-5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatMoney(sub.locked_unit_price)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Fee: {formatMoney(sub.registration_fee_paid)}</p>
                    {sub.registration_fee_waived ? <p className="text-xs text-emerald-500 mt-1">Fee waived</p> : null}
                  </td>
                  <td className="px-5 py-5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatMoney(sub.total_saved)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Target: {formatMoney(sub.required_savings)}</p>
                  </td>
                  <td className="px-5 py-5">
                    <p className="text-sm font-bold text-emerald-600">{formatMoney(sub.access_limit)}</p>
                    <p className="text-xs text-zinc-400 mt-1">{sub.savings_multiplier || 2}x multiplier</p>
                  </td>
                  <td className="px-5 py-5">
                    {sub.promo_snapshot?.label || sub.promo_snapshot?.discount_type ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {sub.promo_snapshot.label || "Promo locked"}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">-</span>
                    )}
                    {sub.promo_snapshot?.locked_unit_price ? (
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Locked {formatMoney(sub.promo_snapshot.locked_unit_price)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-5">
                    <select
                      value={sub.status || 'Active'}
                      onChange={(e) => updateStatus(sub.subscription_id, e.target.value)}
                      className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-zinc-900 dark:text-white p-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No housing subscriptions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingSubscriptions;
