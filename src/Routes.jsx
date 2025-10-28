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

const AppRoutes = ({ headerTitle }) => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<GuestCheckout />} />
      <Route path="/main-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'user']}><MainDashboard headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/cashier-dashboard" element={<ProtectedRoute allowedRoles={['kasir']}><CashierDashboard /></ProtectedRoute>} />
      <Route path="/cashier-dashboard/transaction-history" element={<ProtectedRoute allowedRoles={['kasir']}><CashierTransactionHistory headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/sales-transaction-processing" element={<ProtectedRoute allowedRoles={['admin', 'user']}><SalesTransactionProcessing headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/menu-management" element={<ProtectedRoute allowedRoles={['admin', 'user']}><MenuManagement headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/expense-tracking" element={<ProtectedRoute allowedRoles={['admin', 'user']}><ExpenseTracking headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/transaction-history" element={<ProtectedRoute allowedRoles={['admin', 'user']}><TransactionHistory headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/business-reports" element={<ProtectedRoute allowedRoles={['admin', 'user']}><BusinessReports headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'user']}><UserProfile headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'user']}><Settings headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/credits" element={<ProtectedRoute allowedRoles={['admin', 'user']}><Credits headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute allowedRoles={['admin', 'user']}><NotesPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute allowedRoles={['admin', 'user']}><OrderConfirmationPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/calculator" element={<ProtectedRoute allowedRoles={['admin', 'user']}><CalculatorPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/employee-list" element={<ProtectedRoute allowedRoles={['admin', 'user']}><EmployeeListPage headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/hpp" element={<ProtectedRoute allowedRoles={['admin', 'user']}><Hpp headerTitle={headerTitle} /></ProtectedRoute>} />
      <Route path="/receipt" element={<ProtectedRoute allowedRoles={['admin', 'user']}><ReceiptPage /></ProtectedRoute>} />
      
      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;