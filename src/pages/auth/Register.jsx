import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiUserPlus } from 'react-icons/fi';


const apiUrl = import.meta.env.VITE_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true); // Default to true
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegistrationSetting = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`);
        const data = await response.json();
        if (response.ok) {
          setRegistrationEnabled(data.data.registration_enabled === 'true');
        } else {
          console.error('Failed to fetch registration setting:', data.error);
          setRegistrationEnabled(false); // Assume disabled on error
        }
      } catch (err) {
        console.error('Network error fetching registration setting:', err);
        setRegistrationEnabled(false); // Assume disabled on network error
      }
    };
    fetchRegistrationSetting();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/main-dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Pendaftaran berhasil! Anda sekarang dapat masuk.');
        setFormData({ username: '', password: '', confirmPassword: '' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Pendaftaran gagal');
      }
    } catch (err) {
      setError('Kesalahan jaringan atau server tidak terjangkau');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        
      </div>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 z-10"
      >
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-32 h-32 bg-blue-500 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-wider"
          >
            Buat Akun Baru
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400 text-sm mt-2"
          >
            Daftar untuk mendapatkan akses
          </motion.p>
        </div>

        {registrationEnabled ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative"
            >
              <FiUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                name="username"
                type="text"
                placeholder="Nama Pengguna"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-200/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="relative"
            >
              <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                name="password"
                type="password"
                placeholder="Kata Sandi"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-200/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="relative"
            >
              <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Konfirmasi Kata Sandi"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-200/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              />
            </motion.div>

            {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-600 dark:text-red-400 text-sm text-center">{error}</motion.p>}
            {success && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-green-600 dark:text-green-400 text-sm text-center">{success}</motion.p>}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiUserPlus className="mr-2" />
                  Daftar
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Pendaftaran pengguna saat ini dinonaktifkan oleh administrator.</p>
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8"
        >
          Sudah punya akun?{' '}
          <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
            Masuk di sini
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
