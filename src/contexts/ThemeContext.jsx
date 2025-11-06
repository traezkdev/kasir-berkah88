import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    // Default to 'default' theme if nothing is saved or the value is invalid
    return savedTheme === 'admin' ? 'admin' : 'default';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'default' ? 'admin' : 'default');
  };

  const value = {
    theme,
    toggleTheme,
    setTheme, // Exposing setTheme for more direct control if needed
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
