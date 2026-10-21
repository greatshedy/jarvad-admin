'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';

const formatNaira = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const SettingsView = () => {
  const [form, setForm] = useState({
    vendor_fee: '',
    partner_fee: '',
    sub_duration_months: '',
    penalty_percentage: '',
    support_whatsapp: '',
    housing_registration_fee: '',
    housing_savings_multiplier: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/subscription-settings');
      if (response.data.status === 200) {
        const data = response.data.data || {};
        setForm({
          vendor_fee: data.vendor_fee ?? '',
          partner_fee: data.partner_fee ?? '',
          sub_duration_months: data.sub_duration_months ?? '',
          penalty_percentage: data.penalty_percentage ?? '',
          support_whatsapp: data.support_whatsapp ?? '',
          housing_registration_fee: data.housing_registration_fee ?? '',
          housing_savings_multiplier: data.housing_savings_multiplier ?? '',
        });
      } else {
        setError(response.data.message || 'Failed to load subscription settings.');
      }
    } catch (err) {
      console.error('Error fetching subscription settings:', err);
      setError('Unable to load subscription settings. Please ensure the backend is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setNotice(null);
    setError(null);

    const vendorFee = Number(form.vendor_fee);
    const partnerFee = Number(form.partner_fee);
    const months = Number(form.sub_duration_months);
    const penalty = Number(form.penalty_percentage);
    const supportWhatsapp = String(form.support_whatsapp || '').trim();
    const supportDigits = supportWhatsapp.replace(/\D/g, '');
    const housingFee = Number(form.housing_registration_fee);
    const housingMultiplier = Number(form.housing_savings_multiplier);

    if (!(vendorFee > 0) || !(partnerFee > 0)) {
      setError('Vendor and Partner fees must be greater than 0.');
      return;
    }
    if (!(months >= 1)) {
      setError('Subscription duration must be at least 1 month.');
      return;
    }
    if (!(penalty >= 0) || Number.isNaN(penalty)) {
      setError('Penalty percentage must be 0 or greater.');
      return;
    }
    if (!supportDigits) {
      setError('Support WhatsApp number is required.');
      return;
    }
    if (!(housingFee >= 0) || Number.isNaN(housingFee)) {
      setError('Housing registration fee must be 0 or greater.');
      return;
    }
    if (!(housingMultiplier > 0) || Number.isNaN(housingMultiplier)) {
      setError('Housing savings multiplier must be greater than 0.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.put('/subscription-settings', {
        vendor_fee: vendorFee,
        partner_fee: partnerFee,
        sub_duration_months: months,
        penalty_percentage: penalty,
        support_whatsapp: supportWhatsapp,
        housing_registration_fee: housingFee,
        housing_savings_multiplier: housingMultiplier,
      });
      if (response.data.status === 200) {
        const data = response.data.data || {};
        setForm({
          vendor_fee: data.vendor_fee ?? vendorFee,
          partner_fee: data.partner_fee ?? partnerFee,
          sub_duration_months: data.sub_duration_months ?? months,
          penalty_percentage: data.penalty_percentage ?? penalty,
          support_whatsapp: data.support_whatsapp ?? supportWhatsapp,
          housing_registration_fee: data.housing_registration_fee ?? housingFee,
          housing_savings_multiplier: data.housing_savings_multiplier ?? housingMultiplier,
        });
        setNotice('Subscription pricing updated. New fees apply to new registrations, renewals and auto-debits immediately.');
      } else {
        setError(response.data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving subscription settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceCheck = async () => {
    if (!confirm('Run the subscription reminder/auto-debit check now?')) return;
    try {
      const response = await api.post('/force-check-subscriptions');
      if (response.data.status === 200) {
        setNotice('Subscription check triggered in the background.');
      } else {
        setError(response.data.message || 'Failed to trigger check.');
      }
    } catch (err) {
      console.error('Error triggering subscription check:', err);
      setError('Failed to trigger subscription check.');
    }
  };

  if (isLoading) return <Loader message="Loading Subscription Settings..." />;

  const inputClass =
    'w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';
  const labelClass = 'block text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-2';

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Subscription Settings
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Configure subscriptions, JardHouz housing defaults and late-payment penalties.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-500 font-semibold">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 font-semibold">
          {notice}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="relative rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm"
      >
        {isSaving && <Loader overlay message="Saving..." />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Vendor Subscription Fee (₦)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={form.vendor_fee}
              onChange={handleChange('vendor_fee')}
              className={inputClass}
              placeholder="25000"
              required
            />
            <p className="text-xs text-zinc-400 mt-2">Currently {formatNaira(form.vendor_fee)} / year</p>
          </div>

          <div>
            <label className={labelClass}>Partner Subscription Fee (₦)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={form.partner_fee}
              onChange={handleChange('partner_fee')}
              className={inputClass}
              placeholder="100000"
              required
            />
            <p className="text-xs text-zinc-400 mt-2">Currently {formatNaira(form.partner_fee)} / year</p>
          </div>

          <div>
            <label className={labelClass}>Subscription Duration (months)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.sub_duration_months}
              onChange={handleChange('sub_duration_months')}
              className={inputClass}
              placeholder="12"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Late-Payment Penalty (%)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.penalty_percentage}
              onChange={handleChange('penalty_percentage')}
              className={inputClass}
              placeholder="5"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Housing Registration Fee (₦)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.housing_registration_fee}
              onChange={handleChange('housing_registration_fee')}
              className={inputClass}
              placeholder="100000"
            />
            <p className="text-xs text-zinc-400 mt-2">
              Default one-time fee. An estate can override this.
            </p>
          </div>

          <div>
            <label className={labelClass}>Housing Savings Multiplier</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.housing_savings_multiplier}
              onChange={handleChange('housing_savings_multiplier')}
              className={inputClass}
              placeholder="2"
            />
            <p className="text-xs text-zinc-400 mt-2">
              Savings × multiplier = accessible house value. An estate can override this.
            </p>
          </div>

          <div>
            <label className={labelClass}>Support WhatsApp Number</label>
            <input
              type="tel"
              value={form.support_whatsapp}
              onChange={handleChange('support_whatsapp')}
              className={inputClass}
              placeholder="2347085579245"
              required
            />
            <p className="text-xs text-zinc-400 mt-2">Digits only with country code. Used by the in-app support buttons.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
          Changing a fee affects new registrations, renewals and auto-debits immediately. Existing
          active subscriptions keep their current term; the new fee is charged at their next renewal
          and users are notified in the app.
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-600/20"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleForceCheck}
            className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            Force Subscription Check
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
