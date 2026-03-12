import React, { useState } from 'react';
import { HandCoins, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      const { token, user } = response.data;
      
      // Simpan token ke localStorage
      localStorage.setItem('trzToken', token);
      localStorage.setItem('trzUser', JSON.stringify(user));
      
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg text-white shadow-xl shadow-indigo-100 mb-6">
            <HandCoins size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
          <p className="text-gray-500">Kelola keuanganmu lebih baik dengan trzfinance</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="alfin@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
              <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Lupa Password?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Belum punya akun?{' '}
          <button 
            onClick={onSwitchToRegister}
            className="text-indigo-600 font-bold hover:underline"
          >
            Daftar di sini
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
