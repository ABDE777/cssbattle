import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'auto';

const getTimeBasedTheme = (): 'light' | 'dark' => {
  const hour = new Date().getHours();
  // Light theme from 6 AM to 6 PM
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

const applyTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
};

export const useTheme = () => {
  const [themePreference, setThemePreference] = useState<Theme>(() => {
    return (localStorage.getItem('theme-preference') as Theme) || 'auto';
  });

  const [appliedTheme, setAppliedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const theme = themePreference === 'auto' ? getTimeBasedTheme() : themePreference;
    setAppliedTheme(theme);
    applyTheme(theme);
  }, [themePreference]);

  // Check time every minute if in auto mode
  useEffect(() => {
    if (themePreference === 'auto') {
      const interval = setInterval(() => {
        const theme = getTimeBasedTheme();
        if (theme !== appliedTheme) {
          setAppliedTheme(theme);
          applyTheme(theme);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [themePreference, appliedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemePreference(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };

  const toggleTheme = () => {
    if (themePreference === 'auto') {
      setTheme('light');
    } else if (themePreference === 'light') {
      setTheme('dark');
    } else {
      setTheme('auto');
    }
  };

  return {
    themePreference,
    appliedTheme,
    setTheme,
    toggleTheme,
  };
};
