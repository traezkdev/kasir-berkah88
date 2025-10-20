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
import UserProfile from './pages/UserProfile'; // Import UserProfile
import Settings from './pages/Settings'; // Import Settings
import Credits from './pages/Credits'; // Import Credits
import GuestCheckout from './pages/GuestCheckout'; // Import GuestCheckout
import NotesPage from './pages/Notes'; // Import NotesPage
import OrderConfirmationPage from './pages/OrderConfirmation'; // Import OrderConfirmationPage
import CalculatorPage from './pages/Calculator'; // Import CalculatorPage
import EmployeeListPage from './pages/EmployeeList'; // Import EmployeeListPage

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Optionally, you could add token validation here (e.g., check expiration)
  return children;
};

const AppRoutes = ({ headerTitle }) => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<GuestCheckout />} />
      <Route path="/main-dashboard" element={<ProtectedRoute><MainDashboard headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/sales-transaction-processing" element={<ProtectedRoute><SalesTransactionProcessing headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/menu-management" element={<ProtectedRoute><MenuManagement headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/expense-tracking" element={<ProtectedRoute><ExpenseTracking headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistory headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/business-reports" element={<ProtectedRoute><BusinessReports headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/credits" element={<ProtectedRoute><Credits headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><NotesPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmationPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/calculator" element={<ProtectedRoute><CalculatorPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/employee-list" element={<ProtectedRoute><EmployeeListPage headerTitle={headerTitle} /></ProtectedRoute>} />
      
      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;