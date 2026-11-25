'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/api';
import { STAFF_PERMISSIONS } from '@/staffApi';
import Loader from './Loader';
import Modal from './Modal';

const EMPTY_FORM = { user_name: '', email: '', password: '', permissions: [] };

const generatePassword = () => {
  const bytes = new Uint8Array(12);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
};

const StaffView = () => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [credential, setCredential] = useState(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/staff');
      if (response.data.status === 200) {
        setStaff(response.data.data || []);
      } else {
        setError(response.data.message || 'Unable to load staff accounts.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreate = () => {
    setEditingStaff(null);
    setForm({ ...EMPTY_FORM, password: generatePassword() });
    setError('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditingStaff(member);
    setForm({
      user_name: member.user_name || '',
      email: member.email || '',
      password: '',
      permissions: member.permissions || [],
    });
    setError('');
    setShowModal(true);
  };

  const togglePermission = (permission) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((item) => item !== permission)
          : [...prev.permissions, permission],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.permissions.length) {
      setError('Select at least one permission.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingStaff) {
        const response = await api.patch(`/staff/${editingStaff._id}`, {
          user_name: form.user_name,
          permissions: form.permissions,
        });
        if (response.data.status === 200) {
          setShowModal(false);
          await fetchStaff();
        } else {
          setError(response.data.message || 'Unable to update staff account.');
        }
      } else {
        if (form.password.length < 8) {
          setError('Temporary password must be at least 8 characters.');
          return;
        }
        const response = await api.post('/staff', {
          user_name: form.user_name,
          email: form.email,
          password: form.password,
          permissions: form.permissions,
        });
        if (response.data.status === 200) {
          setCredential({
            email: form.email,
            password: response.data.temporary_password || form.password,
          });
          setShowModal(false);
          await fetchStaff();
        } else {
          setError(response.data.message || 'Unable to create staff account.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to save staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (member) => {
    if (!window.confirm(`Reset the password for ${member.email}? A new temporary password will be generated.`)) {
      return;
    }
    try {
      const response = await api.patch(`/staff/${member._id}`, { reset_password: true });
      if (response.data.status === 200) {
        setCredential({
          email: member.email,
          password: response.data.temporary_password || '',
        });
        await fetchStaff();
      } else {
        setError(response.data.message || 'Unable to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to reset password.');
    }
  };

  const handleToggleActive = async (member) => {
    const action = member.staff_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${member.email}?`)) {
      return;
    }
    try {
      const response = await api.patch(`/staff/${member._id}`, {
        staff_active: !member.staff_active,
      });
      if (response.data.status === 200) {
        await fetchStaff();
      } else {
        setError(response.data.message || 'Unable to update staff status.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update staff status.');
    }
  };

  const copyCredential = async () => {
    if (!credential || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(`Email: ${credential.email}\nTemporary password: ${credential.password}`);
      alert('Credentials copied to clipboard.');
    } catch {
      alert('Copy failed. Please copy the password manually.');
    }
  };

  if (isLoading && staff.length === 0) return <Loader message="Loading staff accounts..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Staff Accounts</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create limited-access accounts for the staff portal at <span className="font-semibold">/staff</span>.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all"
        >
          Add Staff
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {credential && (
        <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Temporary credentials</p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            Share these with the staff member. They must change the password on first login.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="flex-1 rounded-xl bg-white/70 dark:bg-zinc-950/60 px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
              {credential.email} / {credential.password}
            </code>
            <button
              onClick={copyCredential}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
            >
              Copy
            </button>
            <button
              onClick={() => setCredential(null)}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Staff</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Permissions</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {staff.map((member) => (
                <tr key={member._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{member.user_name || 'Staff member'}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(member.permissions || []).map((permission) => (
                        <span
                          key={permission}
                          className="rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        member.staff_active
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                      }`}>
                        {member.staff_active ? 'Active' : 'Disabled'}
                      </span>
                      {member.must_change_password && (
                        <span className="text-[10px] font-semibold text-amber-600">Password change pending</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openEdit(member)}
                        className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(member)}
                        className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                      >
                        Reset password
                      </button>
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold ${
                          member.staff_active
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {member.staff_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {staff.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-zinc-500">No staff accounts yet.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? 'Edit Staff Account' : 'Add Staff Account'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Name</label>
            <input
              type="text"
              value={form.user_name}
              onChange={(event) => setForm({ ...form, user_name: event.target.value })}
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
              placeholder="Staff member name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              disabled={Boolean(editingStaff)}
              required
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 disabled:opacity-60"
              placeholder="staff@company.com"
            />
          </div>

          {!editingStaff && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                  minLength={8}
                  className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, password: generatePassword() })}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                The staff member must change this on first login.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Permissions</label>
            <div className="flex flex-col gap-2">
              {STAFF_PERMISSIONS.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(permission.key)}
                    onChange={() => togglePermission(permission.key)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-sm font-bold text-zinc-900 dark:text-white">{permission.label}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{permission.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffView;
