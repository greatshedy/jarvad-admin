'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';

const PAGE_SIZE = 20;

const formatMoney = (value) =>
  `\u20a6${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') {
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
  }
  if (normalized === 'completed') {
    return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
  }
  if (normalized === 'defaulted') {
    return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
  }
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
};

const planClass = (label) => {
  if (label === 'Installment') return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
  if (label === 'Outright') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (label === 'Housing Saving') return 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400';
  return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
};

const ProgressBar = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="text-xs font-semibold text-amber-600">Not available</span>;
  }
  const percent = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs font-bold text-zinc-500">{percent}%</span>
    </div>
  );
};

const DueLabel = ({ row }) => {
  if (!row.next_payment_date) return <span className="text-zinc-400">\u2014</span>;
  if (row.overdue) {
    return (
      <span className="text-xs font-bold text-rose-600">
        Overdue{row.days_overdue ? ` by ${row.days_overdue}d` : ''}
      </span>
    );
  }
  return (
    <span className="text-xs text-zinc-500">
      {formatDate(row.next_payment_date)}
      {row.days_until_due !== null && row.days_until_due !== undefined ? ` (${row.days_until_due}d)` : ''}
    </span>
  );
};

const SummaryCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
    <p className={`mt-2 break-words text-lg font-black xl:text-xl ${accent || 'text-zinc-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

const PaymentTable = ({ transactions }) => (
  <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
    <table className="w-full min-w-[700px] text-left text-xs">
      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
        <tr>
          {['Date', 'Reference', 'Amount', 'Penalty', 'Months', 'Gateway', 'Status'].map((header) => (
            <th key={header} className="p-3 font-bold uppercase tracking-wider text-zinc-500">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {transactions.map((tx) => (
          <tr key={tx._id || tx.tx_ref}>
            <td className="p-3 text-zinc-600 dark:text-zinc-300">{formatDate(tx.created_at)}</td>
            <td className="p-3 font-mono text-[10px] text-zinc-500">{tx.tx_ref || '\u2014'}</td>
            <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">{formatMoney(tx.total_amount ?? tx.amount)}</td>
            <td className="p-3 text-zinc-500">{formatMoney(tx.penalty_part)}</td>
            <td className="p-3 text-zinc-500">{tx.months_covered ?? '\u2014'}</td>
            <td className="p-3 text-zinc-500">{tx.gateway || '\u2014'}</td>
            <td className="p-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(tx.status)}`}>
                {tx.status || 'Unknown'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PortfoliosView = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
    current_page: 1,
    page_size: PAGE_SIZE,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [overdueFilter, setOverdueFilter] = useState('All');
  const [autoDebitFilter, setAutoDebitFilter] = useState('All');
  const [sortValue, setSortValue] = useState('created_at:desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(() => {
    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== 'All') params.status = statusFilter;
    if (planFilter !== 'All') params.plan_type = planFilter;
    if (overdueFilter !== 'All') params.overdue = overdueFilter === 'Overdue';
    if (autoDebitFilter !== 'All') params.auto_debit = autoDebitFilter === 'On';
    const [sortBy, sortDir] = sortValue.split(':');
    params.sort_by = sortBy;
    params.sort_dir = sortDir;
    return params;
  }, [debouncedSearch, statusFilter, planFilter, overdueFilter, autoDebitFilter, sortValue]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/portfolios', {
          params: { ...filterParams, page, page_size: PAGE_SIZE },
        });
        const payload = response.data || {};
        if (cancelled) return;
        if (payload.status === 200) {
          setPortfolios(payload.data || []);
          setSummary(payload.summary || null);
          setPagination(payload.pagination || {
            total_count: 0,
            total_pages: 1,
            current_page: 1,
            page_size: PAGE_SIZE,
          });
        } else {
          setError(payload.message || 'Unable to load portfolios.');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load portfolios.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filterParams, page]);

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await api.get(`/portfolios/${id}`);
      const payload = response.data || {};
      if (payload.status === 200) {
        setDetail(payload.data);
      } else {
        setError(payload.message || 'Unable to load portfolio details.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load portfolio details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
    setDetailLoading(false);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/portfolios/export', {
        params: filterParams,
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolios-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Unable to export portfolios.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setPlanFilter('All');
    setOverdueFilter('All');
    setAutoDebitFilter('All');
    setSortValue('created_at:desc');
    setPage(1);
  };

  const summaryCards = [
    { label: 'Portfolios', value: summary?.total_portfolios ?? 0 },
    { label: 'Total Value', value: formatMoney(summary?.total_value) },
    { label: 'Collected', value: formatMoney(summary?.total_collected) },
    {
      label: 'Outstanding',
      value: formatMoney(summary?.outstanding),
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Overdue',
      value: summary?.overdue ?? 0,
      accent: (summary?.overdue ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : undefined,
    },
    { label: 'Active', value: summary?.active ?? 0 },
  ];

  const showingFrom = pagination.total_count === 0 ? 0 : (pagination.current_page - 1) * pagination.page_size + 1;
  const showingTo = Math.min(pagination.current_page * pagination.page_size, pagination.total_count);

  if (isLoading && portfolios.length === 0) {
    return <Loader message="Loading portfolios..." />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Portfolios</h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Track user property investments, savings plans, outstanding balances and payment progress.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {summary?.missing_total > 0 && (
        <p className="mb-6 text-xs font-semibold text-amber-600">
          {summary.missing_total} portfolio{summary.missing_total === 1 ? '' : 's'} have no recorded total value; progress is shown as unavailable for those records.
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search user, email, estate or ID..."
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Defaulted">Defaulted</option>
        </select>
        <select
          value={planFilter}
          onChange={(event) => { setPlanFilter(event.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="All">All plan types</option>
          <option value="Outright">Outright</option>
          <option value="Installment">Installment</option>
          <option value="JardHouz Saving">JardHouz Saving</option>
          <option value="Housing Saving">Housing Saving</option>
        </select>
        <select
          value={overdueFilter}
          onChange={(event) => { setOverdueFilter(event.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="All">Due: all</option>
          <option value="Overdue">Overdue only</option>
          <option value="OnTime">Not overdue</option>
        </select>
        <select
          value={autoDebitFilter}
          onChange={(event) => { setAutoDebitFilter(event.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="All">Auto-debit: all</option>
          <option value="On">Auto-debit on</option>
          <option value="Off">Auto-debit off</option>
        </select>
        <div className="flex gap-2 md:col-span-2 xl:col-span-6">
          <select
            value={sortValue}
            onChange={(event) => { setSortValue(event.target.value); setPage(1); }}
            className="min-w-[220px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="created_at:desc">Newest first</option>
            <option value="next_payment_date:asc">Next due first</option>
            <option value="remaining_balance:desc">Outstanding: high to low</option>
            <option value="total_price:desc">Total value: high to low</option>
            <option value="amount_paid:desc">Amount paid: high to low</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                {['User', 'Estate', 'Plan', 'Total', 'Paid', 'Outstanding', 'Progress', 'Next Due', 'Status', 'Auto-debit', ''].map((header) => (
                  <th
                    key={header}
                    className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {portfolios.map((row) => (
                <tr
                  key={row._id}
                  className={`transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${row.overdue ? 'bg-rose-50/40 dark:bg-rose-500/5' : ''}`}
                >
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{row.user?.user_name || 'Unknown user'}</p>
                    <p className="text-xs text-zinc-500">{row.user?.email || row.user_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{row.house_name}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{row._id}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide ${planClass(row.plan_label)}`}>
                      {row.plan_label}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {row.total_recorded ? formatMoney(row.total_price) : (
                      <span className="text-xs font-semibold text-amber-600">Not recorded</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-semibold text-emerald-600">{formatMoney(row.amount_paid)}</td>
                  <td className="p-4 text-sm font-semibold text-amber-600">{formatMoney(row.remaining_balance)}</td>
                  <td className="p-4">
                    <ProgressBar value={row.progress_percent} />
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {row.duration_months > 0 ? `${row.months_paid}/${row.duration_months} months` : 'No monthly schedule'}
                    </p>
                  </td>
                  <td className="p-4"><DueLabel row={row} /></td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-zinc-500">
                    {row.auto_debit ? 'On' : 'Off'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(row._id)}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {portfolios.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-zinc-500">No portfolios match these filters.</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 p-4 sm:flex-row dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500">
            Showing {showingFrom}-{showingTo} of {pagination.total_count}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.current_page <= 1}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-zinc-500">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.total_pages, current + 1))}
              disabled={pagination.current_page >= pagination.total_pages}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={detailOpen} onClose={closeDetail} title="Portfolio Details">
        {detailLoading ? (
          <Loader message="Loading portfolio details..." />
        ) : !detail ? (
          <p className="p-4 text-sm text-zinc-500">Unable to load portfolio details.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    {detail.portfolio.house_name}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {detail.portfolio.user?.user_name || 'Unknown user'}
                    {detail.portfolio.user?.email ? ` \u00b7 ${detail.portfolio.user.email}` : ''}
                  </p>
                  {detail.house?.house_location ? (
                    <p className="text-xs text-zinc-400">{detail.house.house_location}</p>
                  ) : null}
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClass(detail.portfolio.status)}`}>
                  {detail.portfolio.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ['Plan', detail.portfolio.plan_label],
                  ['Total', detail.portfolio.total_recorded ? formatMoney(detail.portfolio.total_price) : 'Not recorded'],
                  ['Paid', formatMoney(detail.portfolio.amount_paid)],
                  ['Outstanding', formatMoney(detail.portfolio.remaining_balance)],
                  ['Monthly', formatMoney(detail.portfolio.monthly_payment)],
                  ['Frequency', detail.portfolio.frequency || '\u2014'],
                  ['Next Due', formatDate(detail.portfolio.next_payment_date)],
                  ['Penalty', formatMoney(detail.portfolio.penalty_amount)],
                  ['Auto-debit', detail.portfolio.auto_debit ? 'On' : 'Off'],
                  ['Months', detail.portfolio.duration_months > 0 ? `${detail.portfolio.months_paid}/${detail.portfolio.duration_months}` : 'No schedule'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                    <p className="mt-1 text-sm font-bold text-zinc-800 dark:text-zinc-200">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Payment progress</span>
                  <span>
                    {detail.portfolio.progress_percent === null || detail.portfolio.progress_percent === undefined
                      ? 'Not available'
                      : `${detail.portfolio.progress_percent}%`}
                  </span>
                </div>
                {detail.portfolio.progress_percent === null || detail.portfolio.progress_percent === undefined ? (
                  <p className="text-xs text-amber-600">
                    The original total price was not recorded for this plan, so progress cannot be calculated.
                  </p>
                ) : (
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${detail.portfolio.progress_percent}%` }} />
                  </div>
                )}
              </div>
            </div>

            {detail.housing_subscription ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Housing subscription</p>
                <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {detail.housing_subscription.unit_type_name || 'Unit'} \u00b7 {detail.housing_subscription.status || 'Unknown'}
                </p>
                <p className="text-xs text-zinc-500">
                  Total saved: {formatMoney(detail.housing_subscription.total_saved)} \u00b7 Access limit: {formatMoney(detail.housing_subscription.access_limit)}
                </p>
              </div>
            ) : null}

            <div>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">Payment history</h4>
              {detail.transactions?.length ? (
                <PaymentTable transactions={detail.transactions} />
              ) : detail.related_transactions?.length ? (
                <>
                  <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    These payments could not be linked directly to this plan in the migrated data. Showing payments recorded for the same user and estate.
                  </p>
                  <PaymentTable transactions={detail.related_transactions} />
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
                  No payments recorded for this portfolio yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortfoliosView;
