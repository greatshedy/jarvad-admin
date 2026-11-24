'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const formatNaira = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (['active', 'matured'].includes(value)) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
  if (['pending_review', 'moratorium', 'pending'].includes(value)) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  if (['rejected', 'failed'].includes(value)) return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
};

const emptyPlan = {
  slug: '',
  name: '',
  description: '',
  unit_price: '',
  units_per_slot: 1,
  annual_roi: '',
  moratorium_months: 4,
  payout_months: 12,
  principal_return: true,
  referral_rate: '',
  unlimited_slots: true,
  total_slots: '',
  active: true,
  order: 99,
  color: '#FF6900',
  benefits: '',
};

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all';

const labelClass = 'block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide';

const BlockInvestmentsView = ({ mode = 'investments' }) => {
  const [tab, setTab] = useState(mode);
  const [summary, setSummary] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => setTab(mode), [mode]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, investmentsRes, plansRes, referralsRes, settingsRes] = await Promise.all([
        api.get('/block/summary'),
        api.get('/block/investments', { params: { page: 1, page_size: 100 } }),
        api.get('/block/plans'),
        api.get('/block/referrals'),
        api.get('/block/settings'),
      ]);
      setSummary(summaryRes.data?.data || null);
      setInvestments(investmentsRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
      setReferrals(referralsRes.data?.data || []);
      setSettings(settingsRes.data?.data || null);
    } catch (err) {
      console.error('Error loading block data:', err);
      setError('Unable to load Jard Block data. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvestments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return investments.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || String(item.status).toLowerCase() === statusFilter.toLowerCase();
      if (!matchesStatus) return false;
      if (!term) return true;
      return [item.ref, item.user_name, item.user_email, item.plan_name, item.transfer_reference]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [investments, search, statusFilter]);

  const refresh = async () => {
    await loadAll();
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected({ _id: id });
    try {
      const response = await api.get(`/block/investments/${id}`);
      setSelected(response.data?.data || null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not load investment.');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const approve = async () => {
    if (!selected) return;
    const note = prompt('Approval note (optional):', '') ?? '';
    try {
      const response = await api.post(`/block/investments/${selected._id}/approve`, { note });
      if (response.data.status === 200) {
        setNotice('Investment approved.');
        setSelected(response.data.data || selected);
        await refresh();
      } else {
        alert(response.data.message || 'Approval failed.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Approval failed.');
    }
  };

  const reject = async () => {
    if (!selected) return;
    const note = prompt('Reason for rejection:', '') ?? '';
    if (!note.trim()) return;
    try {
      const response = await api.post(`/block/investments/${selected._id}/reject`, { note });
      if (response.data.status === 200) {
        setNotice('Investment rejected.');
        setSelected(null);
        await refresh();
      } else {
        alert(response.data.message || 'Rejection failed.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Rejection failed.');
    }
  };

  const markPayout = async (entry) => {
    if (!selected) return;
    const credit = confirm(
      `Record ${entry.kind === 'principal' ? 'principal return' : `ROI month ${entry.period}`} of ${formatNaira(entry.amount)}.\n\nOK = record and credit wallet\nCancel = record only`
    );
    const note = prompt('Payout note (optional):', '') ?? '';
    try {
      const response = await api.post(`/block/investments/${selected._id}/payout`, {
        period: entry.period,
        credit_wallet: credit,
        note,
      });
      if (response.data.status === 200) {
        setNotice('Payout recorded.');
        await openDetail(selected._id);
        await refresh();
      } else {
        alert(response.data.message || 'Could not record payout.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not record payout.');
    }
  };

  const creditReferral = async (referral) => {
    if (!confirm(`Credit ${formatNaira(referral.commission_amount)} to the referrer wallet?`)) return;
    try {
      const response = await api.post(`/block/referrals/${referral._id}/credit`, {});
      if (response.data.status === 200) {
        setNotice('Referral commission credited.');
        await refresh();
      } else {
        alert(response.data.message || 'Could not credit commission.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not credit commission.');
    }
  };

  const openPlanModal = (plan = null) => {
    setEditingPlan(plan);
    setPlanForm(
      plan
        ? {
            ...plan,
            benefits: Array.isArray(plan.benefits) ? plan.benefits.join('\n') : plan.benefits || '',
            referral_rate: Number(plan.referral_rate || 0) * 100,
          }
        : emptyPlan
    );
    setPlanModal(true);
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setSavingPlan(true);
    try {
      const payload = {
        ...planForm,
        slug: planForm.slug || planForm.name.toLowerCase().replace(/\s+/g, '-'),
        unit_price: Number(planForm.unit_price),
        units_per_slot: Number(planForm.units_per_slot),
        annual_roi: Number(planForm.annual_roi),
        moratorium_months: Number(planForm.moratorium_months),
        payout_months: Number(planForm.payout_months),
        referral_rate: Number(planForm.referral_rate || 0) / 100,
        order: Number(planForm.order || 99),
        total_slots: planForm.unlimited_slots ? null : Number(planForm.total_slots || 0),
        benefits: String(planForm.benefits || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const response = editingPlan
        ? await api.put(`/block/plans/${editingPlan._id || editingPlan.slug}`, payload)
        : await api.post('/block/plans', payload);
      if (response.data.status === 200) {
        setPlanModal(false);
        setNotice(editingPlan ? 'Plan updated.' : 'Plan created.');
        await refresh();
      } else {
        alert(response.data.message || 'Could not save plan.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (plan) => {
    if (!confirm(`Delete the ${plan.name} plan? Existing investments keep their snapshots.`)) return;
    try {
      const response = await api.delete(`/block/plans/${plan._id || plan.slug}`);
      if (response.data.status === 200) {
        setNotice('Plan deleted.');
        await refresh();
      } else {
        alert(response.data.message || 'Could not delete plan.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not delete plan.');
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const response = await api.put('/block/settings', settings || {});
      if (response.data.status === 200) {
        setSettings(response.data.data || settings);
        setNotice('Jard Block settings saved.');
      } else {
        alert(response.data.message || 'Could not save settings.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <Loader message="Loading Jard Block..." />;
  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-rose-600">{error}</p>
        <button onClick={loadAll} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Jard Block</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Investments, plans, payouts and referrals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['investments', 'Investments'],
            ['plans', 'Plans'],
            ['referrals', 'Referrals'],
            ['settings', 'Settings'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                tab === key
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          <button onClick={refresh} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
            Refresh
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            ['Total invested', formatNaira(summary.total_invested)],
            ['Active holdings', summary.active_investments],
            ['Pending review', summary.pending_review],
            ['Paid out', formatNaira(summary.total_paid_out)],
            ['Rejected', summary.rejected],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">{label}</p>
              <p className="mt-1 text-xl font-black text-zinc-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'investments' ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Investments</h3>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, reference, plan..."
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white outline-none"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
              >
                {['ALL', 'pending_review', 'active', 'moratorium', 'matured', 'rejected'].map((status) => (
                  <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  {['Investor', 'Plan', 'Amount', 'Status', 'Submitted', ''].map((head) => (
                    <th key={head} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredInvestments.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.user_name || 'Investor'}</p>
                      <p className="text-[10px] text-zinc-500">{item.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.plan_name}</p>
                      <p className="text-[10px] text-zinc-500">{item.slots} slots · {item.total_units} units</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-zinc-900 dark:text-white">{formatNaira(item.total_invested)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(item.status)}`}>
                        {String(item.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(item.submitted_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(item._id)} className="text-xs font-bold text-indigo-600 hover:underline">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredInvestments.length ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">No investments match this filter.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'plans' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openPlanModal()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold">
              Add plan
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan._id || plan.slug} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-zinc-500">{plan.slug}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {plan.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-indigo-600">{formatNaira(plan.slot_value)}<span className="text-xs font-semibold text-zinc-400">/slot</span></p>
                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <p>{plan.annual_roi}% annual ROI · {plan.units_per_slot} units/slot</p>
                  <p>{plan.moratorium_months}-month moratorium · {plan.payout_months} payouts</p>
                  <p>Referral {(Number(plan.referral_rate || 0) * 100).toFixed(1)}% · {plan.unlimited_slots ? 'Unlimited slots' : `${plan.total_slots} slots`}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openPlanModal(plan)} className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">Edit</button>
                  <button onClick={() => deletePlan(plan)} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'referrals' ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Block referrals</h3>
            <p className="text-xs text-zinc-500">Approve legacy registrations and credit pending commissions.</p>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {referrals.map((ref) => (
              <div key={ref._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{ref.referee_name || 'JardX investor'}</p>
                  <p className="text-xs text-zinc-500">{ref.referee_email} · {ref.plan_name || ref.plan_id || 'Block'} · {formatDate(ref.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black text-zinc-900 dark:text-white">{formatNaira(ref.commission_amount)}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(ref.status)}`}>{ref.status}</span>
                  {ref.status === 'pending' ? (
                    <button onClick={() => creditReferral(ref)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Credit</button>
                  ) : null}
                </div>
              </div>
            ))}
            {!referrals.length ? <p className="px-5 py-10 text-center text-sm text-zinc-500">No block referrals yet.</p> : null}
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <form onSubmit={saveSettings} className="max-w-3xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Transfer & disclosure settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelClass}>Bank name</label><input className={inputClass} value={settings?.bank_name || ''} onChange={(event) => setSettings((current) => ({ ...current, bank_name: event.target.value }))} /></div>
            <div><label className={labelClass}>Account name</label><input className={inputClass} value={settings?.account_name || ''} onChange={(event) => setSettings((current) => ({ ...current, account_name: event.target.value }))} /></div>
            <div><label className={labelClass}>Account number</label><input className={inputClass} value={settings?.account_number || ''} onChange={(event) => setSettings((current) => ({ ...current, account_number: event.target.value }))} /></div>
            <div><label className={labelClass}>Support WhatsApp</label><input className={inputClass} value={settings?.support_whatsapp || ''} onChange={(event) => setSettings((current) => ({ ...current, support_whatsapp: event.target.value }))} /></div>
          </div>
          <div><label className={labelClass}>Transfer instructions</label><textarea className={`${inputClass} min-h-24`} value={settings?.transfer_instructions || ''} onChange={(event) => setSettings((current) => ({ ...current, transfer_instructions: event.target.value }))} /></div>
          <div><label className={labelClass}>Risk disclaimer</label><textarea className={`${inputClass} min-h-28`} value={settings?.disclaimer || ''} onChange={(event) => setSettings((current) => ({ ...current, disclaimer: event.target.value }))} /></div>
          <button type="submit" disabled={savingSettings} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60">
            {savingSettings ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      ) : null}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Block investment">
        {detailLoading || !selected?.plan_name ? (
          <Loader message="Loading investment..." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Investor', selected.user_name],
                ['Email', selected.user_email],
                ['Reference', selected.ref],
                ['Plan', selected.plan_name],
                ['Amount', formatNaira(selected.total_invested)],
                ['Status', String(selected.status || '').replace('_', ' ')],
                ['Slots / units', `${selected.slots} / ${selected.total_units}`],
                ['Annual ROI', `${selected.annual_roi}%`],
                ['Monthly ROI', formatNaira(selected.monthly_return)],
                ['Submitted', formatDate(selected.submitted_at)],
                ['Moratorium ends', formatDate(selected.moratorium_ends_at)],
                ['Maturity', formatDate(selected.maturity_date)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white break-words">{value || '—'}</p>
                </div>
              ))}
            </div>

            {selected.proof_url ? (
              <a href={selected.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-indigo-600">
                View payment proof
              </a>
            ) : null}

            {selected.status === 'pending_review' ? (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 p-4">
                <button onClick={approve} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">Approve investment</button>
                <button onClick={reject} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold">Reject</button>
              </div>
            ) : null}

            {selected.admin_note ? (
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-4 text-sm text-zinc-600 dark:text-zinc-300">
                <p className="text-[10px] font-bold uppercase text-zinc-400">Admin note</p>
                <p className="mt-1">{selected.admin_note}</p>
              </div>
            ) : null}

            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Payout ledger</h4>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(selected.payout_ledger || []).map((entry) => (
                    <div key={String(entry.period)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {entry.kind === 'principal' ? 'Principal return' : `ROI month ${entry.period}`}
                        </p>
                        <p className="text-[10px] text-zinc-500">Due {formatDate(entry.due_at)}{entry.paid_at ? ` · Paid ${formatDate(entry.paid_at)}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-zinc-900 dark:text-white">{formatNaira(entry.amount)}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusClass(entry.status)}`}>{entry.status}</span>
                        {entry.status !== 'paid' && selected.status !== 'rejected' && selected.status !== 'pending_review' ? (
                          <button onClick={() => markPayout(entry)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white">Mark paid</button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!(selected.payout_ledger || []).length ? <p className="px-4 py-6 text-sm text-zinc-500">No payout schedule yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={planModal} onClose={() => setPlanModal(false)} title={editingPlan ? 'Edit plan' : 'Create plan'}>
        <form onSubmit={savePlan} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['name', 'Plan name', 'text'],
              ['slug', 'Slug', 'text'],
              ['unit_price', 'Unit price (₦)', 'number'],
              ['units_per_slot', 'Units per slot', 'number'],
              ['annual_roi', 'Annual ROI (%)', 'number'],
              ['moratorium_months', 'Moratorium (months)', 'number'],
              ['payout_months', 'Payout months', 'number'],
              ['referral_rate', 'Referral rate (%)', 'number'],
              ['order', 'Display order', 'number'],
              ['color', 'Color', 'text'],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input type={type} className={inputClass} value={planForm[key] ?? ''} onChange={(event) => setPlanForm((current) => ({ ...current, [key]: event.target.value }))} />
              </div>
            ))}
          </div>
          <div><label className={labelClass}>Description</label><textarea className={`${inputClass} min-h-20`} value={planForm.description || ''} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} /></div>
          <div><label className={labelClass}>Benefits (one per line)</label><textarea className={`${inputClass} min-h-24`} value={planForm.benefits || ''} onChange={(event) => setPlanForm((current) => ({ ...current, benefits: event.target.value }))} /></div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(planForm.principal_return)} onChange={(event) => setPlanForm((current) => ({ ...current, principal_return: event.target.checked }))} /> Principal returned</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(planForm.unlimited_slots)} onChange={(event) => setPlanForm((current) => ({ ...current, unlimited_slots: event.target.checked }))} /> Unlimited slots</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(planForm.active)} onChange={(event) => setPlanForm((current) => ({ ...current, active: event.target.checked }))} /> Active</label>
          </div>
          {!planForm.unlimited_slots ? (
            <div><label className={labelClass}>Total slots</label><input type="number" className={inputClass} value={planForm.total_slots || ''} onChange={(event) => setPlanForm((current) => ({ ...current, total_slots: event.target.value }))} /></div>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={savingPlan} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">{savingPlan ? 'Saving…' : 'Save plan'}</button>
            <button type="button" onClick={() => setPlanModal(false)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-300">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BlockInvestmentsView;
