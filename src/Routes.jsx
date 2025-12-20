import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import MainDashboard from './pages/main-dashboard';
import CashierDashboard from './pages/CashierDashboard';
import SalesTransactionProcessing from './pages/sales-transaction-processing';
import MenuManagement from './pages/menu-management';
import ExpenseTracking from './pages/expense-tracking';
import TransactionHistory from './pages/transaction-history';
import CashierTransactionHistory from './pages/CashierTransactionHistory';
import BusinessReports from './pages/business-reports';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import Credits from './pages/Credits';
import GuestCheckout from './pages/GuestCheckout';
import NotesPage from './pages/Notes';
import OrderConfirmationPage from './pages/OrderConfirmation';
import CalculatorPage from './pages/Calculator';
import EmployeeListPage from './pages/EmployeeList';
import ReceiptPage from './pages/receipt';
import Hpp from './pages/Hpp';
import OwnerDashboard from './pages/owner-dashboard/index.jsx';
import LapakDeposit from './pages/LapakDeposit';
import RawMaterialStockDashboard from './pages/RawMaterialStock';
import RawMaterialStockHistory from './pages/RawMaterialStock/HistoryPage';
import OwnerRawMaterialStockDashboard from './pages/OwnerRawMaterialStock';
import OwnerRawMaterialStockHistory from './pages/OwnerRawMaterialStock/HistoryPage';
import OwnerProfile from './pages/OwnerProfile';
import OwnerBusinessReports from './pages/owner-business-reports/index.jsx';
import UangBisnis from './pages/uang-bisnis/index.jsx';
import CriticalStockPage from './pages/CriticalStock';
import MainCriticalStockPage from './pages/MainCriticalStock';
import AdminUangBisnis from './pages/AdminUangBisnis'; // Add this import
import LaporanLengkap from './pages/LaporanLengkap';
import SimpleTransactionPage from './pages/SimpleTransaction';
import CashReconciliation from './pages/cash-reconciliation';
import ChatbotPage from './pages/chatbot';
import LandingPage from './pages/landing-page';
import BerkahLandingPage from './pages/berkah88';

import TransactionTrash from './pages/TransactionTrash';

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles, redirectPathForForbiddenRoles }) => {
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
      if (redirectPathForForbiddenRoles) {
        return <Navigate to={redirectPathForForbiddenRoles} replace />;
      }
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
      <Route path="/home" element={<LandingPage />} />
      <Route path="/" element={<GuestCheckout />} />

      {/* Admin Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'user']} redirectPathForForbiddenRoles="/cashier-dashboard">
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/main-dashboard" element={<MainDashboard />} />
        <Route path="/menu-management" element={<MenuManagement />} />
        <Route path="/expense-tracking" element={<ExpenseTracking />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/transaction-trash" element={<TransactionTrash />} />
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
        <Route path="/transaksi-sederhana" element={<SimpleTransactionPage />} />
        <Route path="/raw-material-stock" element={<RawMaterialStockDashboard />} />
        <Route path="/raw-material-stock/history" element={<RawMaterialStockHistory />} />
        <Route path="/main-critical-stock" element={<MainCriticalStockPage />} />
        <Route path="/admin-uang-bisnis" element={<AdminUangBisnis headerTitle="Uang Bisnis" />} /> {/* Add this route */}
        <Route path="/laporan-lengkap" element={<LaporanLengkap headerTitle="Laporan Lengkap" />} />
        <Route path="/cash-reconciliation" element={<CashReconciliation headerTitle="Rekonsiliasi Kas" />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
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
        <Route path="/uang-bisnis" element={<UangBisnis headerTitle="Uang Bisnis" />} />
        <Route path="/owner/business-reports" element={<OwnerBusinessReports headerTitle="Laporan Bisnis" />} />
        <Route path="/owner-profile" element={<OwnerProfile />} />
        <Route path="/owner-raw-material-stock" element={<OwnerRawMaterialStockDashboard />} />
        <Route path="/owner-raw-material-stock/history" element={<OwnerRawMaterialStockHistory />} />
        <Route path="/critical-stock" element={<CriticalStockPage />} />
        <Route path="/laporan-lengkap" element={<LaporanLengkap headerTitle="Laporan Lengkap" />} />
      </Route>

      <Route path="/berkah88" element={<BerkahLandingPage />} />
      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
