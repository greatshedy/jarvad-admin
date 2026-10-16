'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

const NotificationsSetup = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    if (ok && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') setRegistered(true);
    }
    if (ok) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW register failed:', e));
    }
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        alert('Push notifications are not configured yet (missing VAPID public key).');
        return;
      }

      await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await api.post('/push/subscribe', {
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      });
      if (res.data.status === 200) setRegistered(true);
    } catch (err) {
      console.error('Enable notifications failed:', err);
      alert('Could not enable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={enable}
      disabled={busy || registered}
      title={registered ? 'Payment notifications are enabled' : 'Enable payment notifications'}
      className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl transition-all ${
        registered
          ? 'bg-emerald-600 text-white cursor-default'
          : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {registered ? 'Notifications On' : busy ? 'Enabling…' : 'Enable Notifications'}
    </button>
  );
};

export default NotificationsSetup;
