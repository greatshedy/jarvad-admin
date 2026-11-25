'use client';

import React, { useEffect, useState } from 'react';
import { staffApi } from '@/staffApi';
import Loader from '../Loader';

const StaffSupportSettings = () => {
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await staffApi.get('/settings/support');
      if (response.data.status === 200) {
        setSupportWhatsapp(response.data.data?.support_whatsapp || '');
      } else {
        setError(response.data.message || 'Unable to load support settings.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load support settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const response = await staffApi.put('/settings/support', {
        support_whatsapp: supportWhatsapp,
      });
      if (response.data.status === 200) {
        setSupportWhatsapp(response.data.data?.support_whatsapp || supportWhatsapp);
        setNotice('Support number updated. It is now used by the in-app support buttons.');
      } else {
        setError(response.data.message || 'Unable to save support settings.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to save support settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader message="Loading support settings..." />;

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Support Settings</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Update the WhatsApp number shown on in-app support buttons.
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

      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
          Support WhatsApp Number
        </label>
        <input
          type="text"
          value={supportWhatsapp}
          onChange={(event) => setSupportWhatsapp(event.target.value)}
          placeholder="2347085579245"
          className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-400 mt-2">Digits only, including country code.</p>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-8 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Support Settings'}
        </button>
      </form>
    </div>
  );
};

export default StaffSupportSettings;
