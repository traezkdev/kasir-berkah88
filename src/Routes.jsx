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
import AnalisisData from './pages/AnalisisData';
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
import { useAppSettings } from './contexts/AppSettingsContext';

// ProtectedRoute component based on app mode
const ModeProtectedRoute = ({ children, modeRequired }) => {
  const { appMode, isLoadingMode } = useAppSettings();

  if (isLoadingMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jika halaman butuh 'full' mode tapi mode saat ini 'simple'
  if (modeRequired === 'full' && appMode === 'simple') {
    return <Navigate to="/main-dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/" element={<BerkahLandingPage />} />
      <Route path="/guest-checkout" element={<GuestCheckout />} />

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

        {/* Full Mode Only Routes */}
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/transaction-trash" element={<ModeProtectedRoute modeRequired="full"><TransactionTrash /></ModeProtectedRoute>} />
        <Route path="/notes" element={<ModeProtectedRoute modeRequired="full"><NotesPage /></ModeProtectedRoute>} />
        <Route path="/calculator" element={<ModeProtectedRoute modeRequired="full"><CalculatorPage /></ModeProtectedRoute>} />
        <Route path="/employee-list" element={<ModeProtectedRoute modeRequired="full"><EmployeeListPage /></ModeProtectedRoute>} />
        <Route path="/hpp" element={<ModeProtectedRoute modeRequired="full"><Hpp /></ModeProtectedRoute>} />
        <Route path="/order-confirmation" element={<ModeProtectedRoute modeRequired="full"><OrderConfirmationPage /></ModeProtectedRoute>} />
        <Route path="/transaksi" element={<ModeProtectedRoute modeRequired="full"><SalesTransactionProcessing /></ModeProtectedRoute>} />
        <Route path="/raw-material-stock" element={<ModeProtectedRoute modeRequired="full"><RawMaterialStockDashboard /></ModeProtectedRoute>} />
        <Route path="/raw-material-stock/history" element={<ModeProtectedRoute modeRequired="full"><RawMaterialStockHistory /></ModeProtectedRoute>} />
        <Route path="/main-critical-stock" element={<ModeProtectedRoute modeRequired="full"><MainCriticalStockPage /></ModeProtectedRoute>} />
        <Route path="/admin-uang-bisnis" element={<ModeProtectedRoute modeRequired="full"><AdminUangBisnis headerTitle="Uang Bisnis" /></ModeProtectedRoute>} />
        <Route path="/laporan-lengkap" element={<ModeProtectedRoute modeRequired="full"><LaporanLengkap headerTitle="Laporan Lengkap" /></ModeProtectedRoute>} />
        <Route path="/cash-reconciliation" element={<ModeProtectedRoute modeRequired="full"><CashReconciliation headerTitle="Rekonsiliasi Kas" /></ModeProtectedRoute>} />

        {/* Simple Mode Allowed Routes */}
        <Route path="/laporan" element={<BusinessReports />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/transaksi-sederhana" element={<SimpleTransactionPage />} />
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

      {/* Shared Admin/Owner Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'user', 'owner']}>
            <DynamicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/analisis-data" element={<AnalisisData />} />
      </Route>


      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
