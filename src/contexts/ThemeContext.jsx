import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [storedTheme, setStoredTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme === 'admin' ? 'admin' : 'default';
  });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [appStyle, setAppStyle] = useState(() => {
    return localStorage.getItem('app-style') || 'clean';
  });

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

  const toggleTheme = () => {
    setStoredTheme(prevTheme => prevTheme === 'default' ? 'admin' : 'default');
  };

  // Determine effective theme: always 'default' on mobile
  const isMobile = windowWidth < 1024;
  const theme = isMobile ? 'default' : storedTheme;

  const value = {
    theme,
    toggleTheme,
    setTheme: setStoredTheme,
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
