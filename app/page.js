'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Dependency-free JWT Decoder
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode Google JWT token:", e);
    return null;
  }
};

export default function Home() {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminEmail, setAdminEmail] = useState('jarvadgroup.business@gmail.com');

  useEffect(() => {
    // Check if session has expired from query string
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setErrorMsg('Session expired. Please sign in again.');
      }
    }

    // If already logged in, redirect directly to dashboard
    const storedUser = localStorage.getItem('admin_user');
    const storedToken = localStorage.getItem('admin_token');
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email === adminEmail) {
          window.location.href = '/dashboard';
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleCredentialResponse = async (googleResponse) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsVerifying(true);

    try {
      const idToken = googleResponse.credential;
      if (!idToken) {
        throw new Error("No Google credential returned.");
      }

      // 1. Decode Google ID token to inspect email instantly on the client side
      const idInfo = decodeJwt(idToken);
      if (!idInfo) {
        throw new Error("Failed to read account information from Google. Please try again.");
      }

      const email = idInfo.email;
      const name = idInfo.name || 'Administrator';
      const picture = idInfo.picture || '';

      // 2. Strict client-side check for authorized admin email
      if (email.toLowerCase() !== adminEmail.toLowerCase()) {
        setIsVerifying(false);
        setErrorMsg("Access Denied: You do not have administrator privileges for this portal.");
        return;
      }

      // 3. Exchanging Google token with Backend `/users/google-auth`
      const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/admin";
      // Construct backend users auth URL (stripping the trailing /admin prefix)
      const authUrl = baseApiUrl.replace(/\/admin\/?$/, '') + "/users/google-auth";

      const backendResponse = await axios.post(authUrl, {
        idToken: idToken,
        platform: "web"
      });

      if (backendResponse.data && backendResponse.data.status === 200) {
        const token = backendResponse.data.token;

        // Store auth keys in localStorage
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify({
          name: name,
          email: email,
          picture: picture
        }));

        setSuccessMsg("Authorized Access! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1200);
      } else {
        throw new Error(backendResponse.data.message || "Backend verification failed.");
      }

    } catch (err) {
      console.error("Authentication error details:", err);
      setIsVerifying(false);
      setErrorMsg(err.message || "An unexpected error occurred during authorization. Please try again.");
    }
  };

  useEffect(() => {
    const initGoogleBtn = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1040584863502-9odvb37pe75p27dh4j5dhuk4d6ojaan9.apps.googleusercontent.com",
            callback: handleCredentialResponse
          });
          
          window.google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            { 
              theme: "filled_blue", 
              size: "large", 
              text: "signin_with", 
              shape: "pill",
              width: "320"
            }
          );
          return true;
        } catch (e) {
          console.error("GSI init error:", e);
        }
      }
      return false;
    };

    if (!initGoogleBtn()) {
      const interval = setInterval(() => {
        if (initGoogleBtn()) {
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950 font-sans">
      
      {/* Immersive Animated Gradient Backdrop and Glowing Decorative Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px] animate-pulse duration-10000"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-violet-950/45 blur-[120px] animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-[40%] left-[60%] w-[350px] h-[350px] rounded-full bg-blue-950/25 blur-[100px] animate-bounce duration-[15000ms]"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
      </div>

      {/* Main Form container with high-fidelity Glassmorphic styles */}
      <div className="relative z-10 w-full max-w-md px-6 py-4 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Decorative subtle border light line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-[1.25rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-500/20 mb-4 transition-transform hover:scale-105 duration-300">
              J
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
              Jarvad Admin
            </h1>
            <p className="text-zinc-400 text-sm font-medium text-center max-w-[280px]">
              Secure administration portal for the Jarvad ecosystem.
            </p>
          </div>

          {/* Alert messages section */}
          {errorMsg && (
            <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Authentication Container */}
          <div className="flex flex-col items-center justify-center py-4">
            {isVerifying ? (
              <div className="flex flex-col items-center py-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-[3px] border-zinc-800"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-zinc-400 text-sm font-semibold mt-4 animate-pulse">
                  Verifying authorization...
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-1"></div>
                
                {/* Google Sign-in API Mount Point */}
                <div id="google-login-btn" className="relative z-20 flex justify-center py-1 transition-transform active:scale-[0.98]"></div>

                <div className="flex items-center gap-1.5 justify-center mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                    Authorized Access Only
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info links */}
        <div className="mt-8 text-center text-xs text-zinc-600 font-semibold select-none flex justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Jarvad Group</span>
          <span>&bull;</span>
          <span className="text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer">Security Protocol v2.4</span>
        </div>
      </div>
    </div>
  );
}
