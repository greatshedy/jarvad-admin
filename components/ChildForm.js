'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDateInputValue = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parts = String(value).split('--');
  if (parts.length !== 3) return '';
  const monthIndex = MONTH_NAMES.indexOf(parts[1]);
  if (monthIndex < 0) return '';
  return `${parts[2]}-${String(monthIndex + 1).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
};

const fromDateInputValue = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  const monthName = MONTH_NAMES[Number(month) - 1];
  if (!year || !monthName || !day) return '';
  return `${Number(day)}--${monthName}--${year}`;
};

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const getInitialSubscriber = (initialData) => {
  const subscriber = initialData?.subscriber || {};
  const id = subscriber.user_id || initialData?.subscriber_user_id || initialData?.user_id || '';
  const name = subscriber.name || initialData?.subscriber_name || '';
  const email = subscriber.email || initialData?.subscriber_email || '';
  const phone = subscriber.phone || initialData?.subscriber_phone || '';
  return id ? { _id: id, user_name: name, email, phone_number: phone } : null;
};

const ChildForm = ({ onSubmit, onCancel, initialData }) => {
  const [form, setForm] = useState(() => ({
    child_name: initialData?.child_name || '',
    child_dob: toDateInputValue(initialData?.child_dob),
    child_gender: initialData?.child_gender || '',
    plan_type: initialData?.plan_type || 'child_savings',
    monthly_amount: initialData?.monthly_amount ?? '',
    total_months: initialData?.total_months ?? '',
    months_paid: initialData?.months_paid ?? 1,
    investment_period_years: initialData?.investment_period_years ?? '',
    return_percentage: initialData?.return_percentage ?? 0,
    status: initialData?.status || 'Active',
  }));
  const [selectedSubscriber, setSelectedSubscriber] = useState(() => getInitialSubscriber(initialData));
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const response = await api.get('/users/options', {
          params: { search: userSearch, limit: 30 },
        });
        if (active) setUserOptions(response.data?.data || []);
      } catch (err) {
        if (active) setError('Could not load subscriber accounts.');
        console.error('Error loading subscribers:', err);
      } finally {
        if (active) setLoadingUsers(false);
      }
    }, userSearch ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [userSearch]);

  const expectedReturn = useMemo(() => {
    const monthly = Number(form.monthly_amount) || 0;
    const months = Number(form.total_months) || 0;
    const percentage = Number(form.return_percentage) || 0;
    return monthly * months * (1 + percentage / 100);
  }, [form.monthly_amount, form.total_months, form.return_percentage]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const selectSubscriber = (user) => {
    setSelectedSubscriber(user);
    setUserSearch(user.user_name || user.email || '');
    setShowUserOptions(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedSubscriber?._id) {
      setError('Select the parent/subscriber account for this child.');
      return;
    }

    const payload = {
      subscriber_user_id: selectedSubscriber._id,
      user_id: selectedSubscriber._id,
      child_name: form.child_name.trim(),
      child_dob: fromDateInputValue(form.child_dob),
      child_gender: form.child_gender.trim(),
      plan_type: form.plan_type,
      monthly_amount: Number(form.monthly_amount) || 0,
      total_months: Number(form.total_months) || 0,
      months_paid: Number(form.months_paid) || 0,
      investment_period_years: Number(form.investment_period_years) || 0,
      return_percentage: Number(form.return_percentage) || 0,
      status: form.status,
    };

    if (!payload.child_name || !payload.child_dob || !payload.child_gender) {
      setError('Child name, date of birth, and gender are required.');
      return;
    }
    if (payload.monthly_amount <= 0 || payload.total_months < 1 || payload.investment_period_years < 1) {
      setError('Enter a valid monthly amount, total months, and investment period.');
      return;
    }
    if (payload.months_paid < 0 || payload.months_paid > payload.total_months) {
      setError('Months paid must be between zero and the total months.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not save the child investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {initialData ? 'Edit Child Investment' : 'Add Child Investment'}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Attach the plan to the parent account that subscribes the child.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Parent / Subscriber</label>
          <input
            type="text"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(event.target.value);
              setShowUserOptions(true);
              if (selectedSubscriber && event.target.value !== (selectedSubscriber.user_name || selectedSubscriber.email)) {
                setSelectedSubscriber(null);
              }
            }}
            onFocus={() => setShowUserOptions(true)}
            placeholder="Search by parent name, email, or phone"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          />
          {selectedSubscriber ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="font-bold text-emerald-800 dark:text-emerald-300">{selectedSubscriber.user_name || 'Unnamed parent'}</p>
              <p className="text-emerald-700 dark:text-emerald-400">{selectedSubscriber.email || 'No email'}</p>
              <p className="text-emerald-700 dark:text-emerald-400">{selectedSubscriber.phone_number || 'No phone'}</p>
            </div>
          ) : null}
          {showUserOptions ? (
            <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              {loadingUsers ? (
                <p className="px-4 py-3 text-sm text-zinc-500">Searching accounts...</p>
              ) : userOptions.length ? (
                userOptions.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => selectSubscriber(user)}
                    className="block w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <span className="block text-sm font-bold text-zinc-900 dark:text-white">{user.user_name || 'Unnamed parent'}</span>
                    <span className="block text-xs text-zinc-500">{user.email || 'No email'} {user.phone_number ? `· ${user.phone_number}` : ''}</span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-zinc-500">No matching accounts found.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Child Name</label>
            <input
              type="text"
              required
              value={form.child_name}
              onChange={(event) => update('child_name', event.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date of Birth</label>
            <input
              type="date"
              required
              value={form.child_dob}
              onChange={(event) => update('child_dob', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gender</label>
            <select
              value={form.child_gender}
              onChange={(event) => update('child_gender', event.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Plan Type</label>
            <select
              value={form.plan_type}
              onChange={(event) => update('plan_type', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            >
              <option value="child_savings">Child Savings</option>
              <option value="child_property">Child Property</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Monthly Amount</label>
            <input
              type="number"
              min="1"
              required
              value={form.monthly_amount}
              onChange={(event) => update('monthly_amount', event.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total Months</label>
            <input
              type="number"
              min="1"
              required
              value={form.total_months}
              onChange={(event) => update('total_months', event.target.value)}
              placeholder="e.g. 120"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Months Paid</label>
            <input
              type="number"
              min="0"
              required
              value={form.months_paid}
              onChange={(event) => update('months_paid', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Investment Period (Years)</label>
            <input
              type="number"
              min="1"
              required
              value={form.investment_period_years}
              onChange={(event) => update('investment_period_years', event.target.value)}
              placeholder="e.g. 10"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Return Percentage</label>
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={form.return_percentage}
              onChange={(event) => update('return_percentage', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Status</label>
            <select
              value={form.status}
              onChange={(event) => update('status', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Defaulted">Defaulted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Calculated Maturity Value</p>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(expectedReturn)}</p>
        </div>

        <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Child Investment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
