'use client';

import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'estates', 'partners', 'users', 'finance', 'withdrawals', 'reports', 'settings', 'jardproc', 'jardproc-orders'

  return (
    <NavigationContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
