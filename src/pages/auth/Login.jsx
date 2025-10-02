import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/main-dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Redirect to dashboard or previous page
        navigate('/main-dashboard'); 
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <Icon name="Lock" size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary">Login</h2>
          <p className="text-text-secondary text-sm">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="Masukkan username Anda"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Masukkan password Anda"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" loading={isLoading}>
            Login
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Belum punya akun? <Link to="/register" className="text-primary hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;