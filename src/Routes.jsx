import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import MainDashboard from './pages/main-dashboard';
import SalesTransactionProcessing from './pages/sales-transaction-processing';
import MenuManagement from './pages/menu-management';
import ExpenseTracking from './pages/expense-tracking';
import TransactionHistory from './pages/transaction-history';
import BusinessReports from './pages/business-reports';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login'; // Import Login
import Register from './pages/auth/Register'; // Import Register

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Optionally, you could add token validation here (e.g., check expiration)
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
      <Route path="/main-dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
      <Route path="/sales-transaction-processing" element={<ProtectedRoute><SalesTransactionProcessing /></ProtectedRoute>} />
      <Route path="/menu-management" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
      <Route path="/expense-tracking" element={<ProtectedRoute><ExpenseTracking /></ProtectedRoute>} />
      <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
      <Route path="/business-reports" element={<ProtectedRoute><BusinessReports /></ProtectedRoute>} />
      
      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;