import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [storedTheme, setStoredTheme] = useState(() => {
    const isExplicit = localStorage.getItem('theme_user_selected') === 'true';
    const savedTheme = localStorage.getItem('app-theme');
    if (isExplicit && (savedTheme === 'admin' || savedTheme === 'default')) {
      return savedTheme;
    }
    // Default tema di awal untuk user baru adalah 'admin'
    return 'admin';
  });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [appStyle, setAppStyle] = useState(() => {
    return localStorage.getItem('app-style') || 'clean';
  });

  useEffect(() => {
    const handleReset = (e) => {
      setStoredTheme(e.detail || 'admin');
    };
    window.addEventListener('app-theme-reset', handleReset);
    return () => window.removeEventListener('app-theme-reset', handleReset);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('app-theme', storedTheme);
  }, [storedTheme]);

  useEffect(() => {
    localStorage.setItem('app-style', appStyle);
    if (appStyle === 'elegant') {
      document.documentElement.classList.add('style-elegant');
    } else {
      document.documentElement.classList.remove('style-elegant');
    }
  }, [appStyle]);

  const setTheme = (newTheme) => {
    localStorage.setItem('theme_user_selected', 'true');
    setStoredTheme(newTheme);
  };

  const toggleTheme = () => {
    localStorage.setItem('theme_user_selected', 'true');
    setStoredTheme(prevTheme => prevTheme === 'default' ? 'admin' : 'default');
  };

  // Determine effective theme: always 'default' on mobile
  const isMobile = windowWidth < 1024;
  const theme = isMobile ? 'default' : storedTheme;

  const value = {
    theme,
    toggleTheme,
    setTheme,
    appStyle,
    setAppStyle,
    isMobile,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
