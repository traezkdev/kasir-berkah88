import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';

const AdminRoutes = () => {
  // TODO: Replace with actual role-based authentication logic
  const user = JSON.parse(localStorage.getItem('user'));
  const isAuthenticated = user && user.role === 'admin';

  return isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />;
};

export default AdminRoutes;
