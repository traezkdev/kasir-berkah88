import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

const apiUrl = import.meta.env.VITE_API_URL;

const UserProfile = () => {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`);
      const data = await response.json();
      if (response.ok) {
        setUsername(data.data.username);
        setNewUsername(data.data.username); // Initialize newUsername with current username
      } else {
        setError(data.error || 'Failed to fetch user profile');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Fetch profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (newUsername === username) {
      setError('New username is the same as current username.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${apiUrl}/api/user/profile/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Username updated successfully!');
        setUsername(newUsername); // Update current username state
      } else {
        setError(data.error || 'Failed to update username');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Update username error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) { // Example: minimum password length
      setError('New password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${apiUrl}/api/user/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error or server unreachable');
      console.error('Change password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Call backend logout endpoint (optional, mainly for logging/blacklist if implemented)
      await authFetch(`${apiUrl}/api/logout`, { method: 'POST' });
      localStorage.removeItem('token'); // Clear token from local storage
      navigate('/login'); // Redirect to login page
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout API fails, still clear token and redirect
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbs = [
    { name: 'Home', path: '/main-dashboard' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <NavigationHeader title="User Profile" />
      <BreadcrumbNavigation paths={breadcrumbs} />
      <div className="flex-grow pt-20 px-6 overflow-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 space-y-8">
          <h2 className="text-2xl font-bold text-text-primary text-center">User Profile</h2>

          {message && <p className="text-success text-center">{message}</p>}
          {error && <p className="text-destructive text-center">{error}</p>}

          {isLoading && <p className="text-center">Loading...</p>}

          {!isLoading && (
            <>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Current Username: {username}</h3>
                <form onSubmit={handleUpdateUsername} className="space-y-4">
                  <Input
                    label="New Username"
                    name="newUsername"
                    type="text"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Update Username
                  </Button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    name="confirmNewPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Change Password
                  </Button>
                </form>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button onClick={handleLogout} className="w-full bg-destructive hover:bg-red-700" disabled={isLoading}>
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
