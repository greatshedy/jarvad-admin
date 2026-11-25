'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { staffApi } from '@/staffApi';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setError('Session expired. Please sign in again.');
    }

    const token = localStorage.getItem('staff_token');
    const user = localStorage.getItem('staff_user');
    if (token && user) {
      window.location.href = '/staff/dashboard';
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await staffApi.post('/login', { email, password });
      const data = response.data || {};

      if (data.status !== 200 || !data.token) {
        setError(data.message || 'Unable to sign in.');
        return;
      }

      localStorage.setItem('staff_token', data.token);
      localStorage.setItem('staff_user', JSON.stringify(data.user || {}));
      localStorage.setItem('staff_permissions', JSON.stringify(data.permissions || []));
      localStorage.setItem('staff_must_change', data.must_change_password ? 'true' : 'false');

      window.location.href = '/staff/dashboard';
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-900/30 blur-[120px] animate-pulse duration-10000"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-950/45 blur-[120px] animate-pulse duration-[8000ms]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-4">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-indigo-500 rounded-[1.25rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-500/20 mb-4">
              J
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Staff Portal</h1>
            <p className="text-zinc-400 text-sm font-medium text-center max-w-[280px]">
              Sign in with the email and password created for you by an administrator.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-2xl bg-zinc-950/70 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-2xl bg-zinc-950/70 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs font-semibold text-zinc-500 hover:text-zinc-300">
              Administrator login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
