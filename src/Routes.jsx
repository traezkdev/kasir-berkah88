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
import OwnerDashboard from './pages/OwnerDashboard'; // Import OwnerDashboard
import LapakDeposit from './pages/LapakDeposit'; // Import LapakDeposit
import RawMaterialStockDashboard from './pages/RawMaterialStock'; // Import RawMaterialStockDashboard
import RawMaterialStockHistory from './pages/RawMaterialStock/HistoryPage'; // Import RawMaterialStockHistory

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    // Check token expiration
    const currentTime = Date.now() / 1000; // current time in seconds
    if (decodedToken.exp < currentTime) {
      console.warn("Token expired, redirecting to login.");
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="*" replace />;
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
          <ProtectedRoute allowedRoles={['admin', 'user', 'owner']}>
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
        <Route path="/raw-material-stock" element={<RawMaterialStockDashboard />} />
        <Route path="/raw-material-stock/history" element={<RawMaterialStockHistory />} />
      </Route>

      {/* Cashier Dashboard Routes */}
      <Route 
        element={
          <ProtectedRoute allowedRoles={['kasir']}>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/cashier-dashboard" element={<CashierDashboard />} />
        <Route path="/cashier-transaction-history" element={<CashierTransactionHistory />} />
      </Route>
      {/* Lapak Deposit Routes (Accessible by Admin, User, Kasir, Owner) */}
      <Route 
        element={
          <ProtectedRoute allowedRoles={['admin', 'user', 'kasir', 'owner']}>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/lapak-deposit" element={<LapakDeposit />} />
      </Route>
      <Route path="/receipt" element={<ProtectedRoute allowedRoles={['admin', 'kasir', 'user']}><ReceiptPage /></ProtectedRoute>} />

      {/* Owner Dashboard Routes */}
      <Route 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/owner-dashboard" element={<OwnerDashboard headerTitle="Dashboard Owner" />} />
      </Route>

      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;