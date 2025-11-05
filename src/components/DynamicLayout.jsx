import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import AdminLayout from './admin/layout/AdminLayout';

const DynamicLayout = () => {
  const { theme } = useTheme();

  // If the user is an admin and has the admin theme selected, use the AdminLayout.
  // Otherwise, just render the page component directly, which will use its own header.
  return theme === 'admin' ? <AdminLayout /> : <Outlet />;
};

export default DynamicLayout;
