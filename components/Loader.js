'use client';

import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../public/Sandy Loading.json';

const Loader = ({ fullPage = false, overlay = false, message = '' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${fullPage ? 'w-48 h-48 sm:w-64 sm:h-64' : 'w-24 h-24 sm:w-32 sm:h-32'}`}>
        <Lottie 
          animationData={animationData} 
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {message && (
        <p className="text-zinc-600 dark:text-zinc-400 font-bold animate-pulse text-sm sm:text-base tracking-wide uppercase">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-[100] flex items-center justify-center animate-in fade-in duration-500">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-[4px] z-50 flex items-center justify-center rounded-[2rem] sm:rounded-[2.5rem] animate-in fade-in duration-300">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
