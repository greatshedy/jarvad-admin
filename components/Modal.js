'use client';

import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 animate-in fade-in">
      {/* Overlay with glassmorphism backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-zinc-800/50 overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 py-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content Area with scroll */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-88px)] thin-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
