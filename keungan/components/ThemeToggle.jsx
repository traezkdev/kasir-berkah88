import React, { useState } from 'react';
import { Sun, Moon, Loader2 } from 'lucide-react';
import api from '../services/api';

const ThemeToggle = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const isDark = user?.dark_mode === 1 || user?.dark_mode === true;

  const toggleTheme = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newDarkMode = !isDark;
      const res = await api.put('/auth/profile', {
        ...user,
        dark_mode: newDarkMode ? 1 : 0
      });
      
      if (onUpdateUser) {
        onUpdateUser(res.data.user);
      }
    } catch (err) {
      console.error('Gagal update tema:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={loading}
      className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center relative ${
        isDark 
          ? 'bg-slate-800 text-yellow-400 border border-slate-700 hover:bg-slate-700 shadow-lg shadow-black/20' 
          : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-white hover:shadow-sm'
      }`}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : isDark ? (
        <Sun size={20} className="animate-in fade-in zoom-in spin-in-90 duration-300" />
      ) : (
        <Moon size={20} className="animate-in fade-in zoom-in duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
