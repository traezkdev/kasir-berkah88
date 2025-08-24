import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch'; // Add this import

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
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      // --- START DEBUGGING CODE ---
      if (!response.ok) {
        console.error('Backend response not OK:', response);
        try {
          const errorData = await response.json();
          console.error('Backend error data:', errorData);
          setError(errorData.error || 'Registration failed');
        } catch (jsonError) {
          console.error('Failed to parse backend error response as JSON:', jsonError);
          setError('Registration failed: Server returned non-JSON error.');
        }
        setIsLoading(false);
        return;
      }
      // --- END DEBUGGING CODE ---

      const data = await response.json(); // This line will only be reached if response.ok

      if (response.ok) { // This check is redundant now but harmless
        setSuccess('Registration successful! You can now log in.');
        setFormData({ username: '', password: '', confirmPassword: '' }); // Clear form
        // Optionally navigate to login after a delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // This else block will technically not be reached due to the 'if (!response.ok)' above
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <Icon name="UserPlus" size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary">Register</h2>
          <p className="text-text-secondary text-sm">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="Pilih username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Buat password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Konfirmasi password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />

          {error && <p className="text-destructive text-sm text-center">{error}</p>}
          {success && <p className="text-success text-sm text-center">{success}</p>}

          <Button type="submit" className="w-full" loading={isLoading}>
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Sudah punya akun? <Link to="/login" className="text-primary hover:underline">Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;