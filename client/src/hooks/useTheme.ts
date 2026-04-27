import { useState, useEffect } from 'react';

export interface ThemeData {
  companyName: string;
  companyLogo: string | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isUpdatingDarkMode: boolean;
}

export function useTheme(): ThemeData {
  const [darkMode, setDarkMode] = useState(false);
  const [isUpdatingDarkMode, setIsUpdatingDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      const isDark = savedTheme === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsUpdatingDarkMode(true);
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update DOM class
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    // Reset updating state
    setTimeout(() => setIsUpdatingDarkMode(false), 300);
  };

  return {
    companyName: 'Al Barimi Motors',
    companyLogo: '/company-logo.svg',
    darkMode,
    toggleDarkMode,
    isUpdatingDarkMode,
  };
}