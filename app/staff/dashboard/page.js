'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { staffApi } from '@/staffApi';
import StaffSidebar from '@/components/StaffSidebar';
import StaffEstates from '@/components/staff/StaffEstates';
import StaffProducts from '@/components/staff/StaffProducts';
import StaffSupportSettings from '@/components/staff/StaffSupportSettings';
import StaffChangePassword from '@/components/staff/StaffChangePassword';
import Loader from '@/components/Loader';

const readStoredUser = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('staff_user') || '{}');
  } catch {
    return {};
  }
};

const readStoredPermissions = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('staff_permissions') || '[]');
  } catch {
    return [];
  }
};

const readStoredMustChange = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('staff_must_change') === 'true';
};

export default function StaffDashboardPage() {
  const [staffUser, setStaffUser] = useState(readStoredUser);
  const [permissions, setPermissions] = useState(readStoredPermissions);
  const [mustChange, setMustChange] = useState(readStoredMustChange);
  const [activeView, setActiveView] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const allowedViews = useMemo(() => {
    const views = [];
    if (permissions.includes('estates.manage')) views.push('estates');
    if (permissions.includes('products.manage')) views.push('products');
    if (permissions.includes('settings.support')) views.push('support');
    views.push('change-password');
    return views;
  }, [permissions]);

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      const response = await staffApi.get('/me');
      const data = response.data || {};
      if (data.status === 200) {
        setStaffUser(data.user || {});
        setPermissions(data.user?.permissions || []);
        setMustChange(Boolean(data.user?.must_change_password));
        localStorage.setItem('staff_user', JSON.stringify(data.user || {}));
        localStorage.setItem('staff_permissions', JSON.stringify(data.user?.permissions || []));
        localStorage.setItem('staff_must_change', data.user?.must_change_password ? 'true' : 'false');
      } else {
        setError(data.message || 'Unable to load your staff profile.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
        localStorage.removeItem('staff_permissions');
        localStorage.removeItem('staff_must_change');
        window.location.href = '/staff';
        return;
      }
      const message = err.response?.data?.detail || err.response?.data?.message || 'Unable to load your staff profile.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('staff_token');
    if (!token) {
      window.location.href = '/staff';
      return;
    }
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (mustChange) {
      setActiveView('change-password');
      return;
    }
    if (!allowedViews.includes(activeView)) {
      setActiveView(allowedViews[0] || 'change-password');
    }
  }, [mustChange, allowedViews, activeView]);

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    localStorage.removeItem('staff_permissions');
    localStorage.removeItem('staff_must_change');
    window.location.href = '/staff';
  };

  const handlePasswordChanged = async () => {
    setMustChange(false);
    await loadProfile();
  };

  if (isLoading) {
    return <Loader fullPage message="Loading staff portal..." />;
  }

  const visiblePermissions = mustChange ? [] : permissions;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <StaffSidebar
        activeView={mustChange ? 'change-password' : activeView}
        onSelect={setActiveView}
        permissions={visiblePermissions}
        staffUser={staffUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Staff Portal</p>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
              Welcome{staffUser?.user_name ? `, ${staffUser.user_name}` : ''}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {staffUser?.email || 'Staff account'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                {permission}
              </span>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {mustChange ? (
          <StaffChangePassword forced onSuccess={handlePasswordChanged} />
        ) : activeView === 'estates' && permissions.includes('estates.manage') ? (
          <StaffEstates />
        ) : activeView === 'products' && permissions.includes('products.manage') ? (
          <StaffProducts />
        ) : activeView === 'support' && permissions.includes('settings.support') ? (
          <StaffSupportSettings />
        ) : activeView === 'change-password' ? (
          <StaffChangePassword onSuccess={handlePasswordChanged} />
        ) : (
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-10 text-center">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">No access assigned</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Your account has no management permissions. Please contact an administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
