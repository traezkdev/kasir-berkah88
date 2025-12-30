import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme === 'admin' ? 'admin' : 'default';
  });

  const [appStyle, setAppStyle] = useState(() => {
    return localStorage.getItem('app-style') || 'clean';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-style', appStyle);
    if (appStyle === 'elegant') {
      document.documentElement.classList.add('style-elegant');
    } else {
      document.documentElement.classList.remove('style-elegant');
    }
  }, [appStyle]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'default' ? 'admin' : 'default');
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    appStyle,
    setAppStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
