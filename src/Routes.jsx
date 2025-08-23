import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import MainDashboard from './pages/main-dashboard';
import TransactionHistory from './pages/transaction-history';
import MenuManagement from './pages/menu-management';
import BusinessReports from './pages/business-reports';
import ExpenseTracking from './pages/expense-tracking';
import SalesTransactionProcessing from './pages/sales-transaction-processing';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<BusinessReports />} />
        <Route path="/main-dashboard" element={<MainDashboard />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/menu-management" element={<MenuManagement />} />
        <Route path="/business-reports" element={<BusinessReports />} />
        <Route path="/expense-tracking" element={<ExpenseTracking />} />
        <Route path="/sales-transaction-processing" element={<SalesTransactionProcessing />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
