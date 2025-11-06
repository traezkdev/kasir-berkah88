import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import MainDashboard from './pages/main-dashboard';
import CashierDashboard from './pages/CashierDashboard';
import SalesTransactionProcessing from './pages/sales-transaction-processing';
import MenuManagement from './pages/menu-management';
import ExpenseTracking from './pages/expense-tracking';
import TransactionHistory from './pages/transaction-history';
import CashierTransactionHistory from './pages/CashierTransactionHistory';
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
import ReceiptPage from './pages/receipt'; // Import ReceiptPage
import Hpp from './pages/Hpp'; // Import Hpp

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    return <Navigate to="/login" replace />;
  }

  return children;
};

import DynamicLayout from './components/DynamicLayout';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<GuestCheckout />} />

      {/* Admin Dashboard Routes */}
      <Route 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/main-dashboard" element={<MainDashboard />} />
        <Route path="/menu-management" element={<MenuManagement />} />
        <Route path="/expense-tracking" element={<ExpenseTracking />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/business-reports" element={<BusinessReports />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/employee-list" element={<EmployeeListPage />} />
        <Route path="/hpp" element={<Hpp />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/sales-transaction-processing" element={<SalesTransactionProcessing />} />
      </Route>
      <Route path="/receipt" element={<ProtectedRoute allowedRoles={['admin', 'user']}><ReceiptPage /></ProtectedRoute>} />

      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;