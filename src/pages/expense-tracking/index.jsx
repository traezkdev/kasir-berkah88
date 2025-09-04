import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import ExpenseEntryForm from './components/ExpenseEntryForm';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import ExpenseHistoryTable from './components/ExpenseHistoryTable';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import EditExpenseModal from './components/EditExpenseModal'; // Import the modal
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import authFetch from '../../utils/authFetch';
import { exportToExcel, exportToPdf, prepareExpenseDataForExport } from '../../utils/exportUtils';

const apiUrl = import.meta.env.VITE_API_URL;

const ExpenseTracking = ({ headerTitle }) => {
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [notification, setNotification] = useState(null); // New state for notification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] = useState(false); // New state
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(null); // New state

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hide after 3 seconds
  };

  // Define fetch functions outside useEffects
  const fetchExpenses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses`);
      const data = await response.json();
      if (data.message === 'success') {
        console.log('Fetched expenses:', data.data);
        setExpenses(data.data);
      } else {
        console.error('Failed to fetch expenses:', data.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items`);
      const data = await response.json();
      if (data.message === 'success') {
        setMenuItems(data.data);
      } else {
        console.error('Failed to fetch menu items:', data.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  };

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`);
      const data = await response.json();
      if (data.message === 'success') {
        setTransactions(data.data);
      } else {
        console.error('Failed to fetch transactions:', data.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  // Call fetch functions inside useEffects
  useEffect(() => {
    fetchExpenses();
    fetchMenuItems();
    fetchTransactions();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in ExpenseTracking:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && menuItems.length > 0) {
      const today = new Date().toDateString();
      const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;
      const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      setDashboardMetrics({
        todaySales: { value: formatCurrency(todaySales), change: '+12%', trend: 'up' },
        totalTransactions: { value: todayTransactions.length.toString(), change: '+8%', trend: 'up' },
        averageOrder: { value: formatCurrency(averageOrderToday), change: '+5%', trend: 'up' },
        lowStock: { value: lowStockItems.toString(), change: '-2', trend: 'down' }
      });
    }
  }, [transactions, menuItems]);

  const handleAddExpense = async (expenseData) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.message === 'success') {
          fetchExpenses(); // Refetch to get the latest list
        } else {
          console.error('Failed to add expense:', result.error || 'Unknown error');
        }
      } else {
        console.error('Failed to add expense (HTTP error):', result.error || result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExpense = async (expenseData) => {
    if (!editingExpense) return;
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      const result = await response.json();
      if (result.message === 'success') {
        fetchExpenses();
        handleCloseEditModal();
      } else {
        console.error('Failed to update expense:', result.error);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.message === 'deleted') {
        fetchExpenses(); // Refetch to update the list
      } else {
        console.error('Failed to delete expense:', result.error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleBulkDelete = async (confirmed = false) => {
    if (confirmed) {
      try {
        const response = await authFetch(`${apiUrl}/api/expenses`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.message === 'all deleted') {
          fetchExpenses(); // Refetch to show an empty list
          showNotification('Semua pengeluaran berhasil dihapus!', 'success');
        } else {
          console.error('Failed to bulk delete expenses:', result.error);
          showNotification('Gagal menghapus semua pengeluaran.', 'error');
        }
      } catch (error) {
        console.error('Error bulk deleting expenses:', error);
        showNotification('Terjadi kesalahan saat menghapus pengeluaran.', 'error');
      } finally {
        setShowBulkDeleteConfirmModal(false); // Close modal
      }
    } else {
      setShowBulkDeleteConfirmModal(true);
    }
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingExpense(null);
    setIsEditModalOpen(false);
  };

  const handleExportData = (format, data) => {
    try {
      const dataToExport = prepareExpenseDataForExport(data);
      if (format === 'excel') {
        exportToExcel(dataToExport, 'Laporan_Pengeluaran');
        showNotification('Data pengeluaran berhasil diekspor ke Excel!', 'success');
      } else if (format === 'pdf') {
        exportToPdf(dataToExport, 'Laporan_Pengeluaran');
        showNotification('Data pengeluaran berhasil diekspor ke PDF!', 'success');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Gagal mengekspor data. Silakan coba lagi.', 'error');
    }
  };

  const calculateSummaryMetrics = () => {
    const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const expenseCount = expenses?.length;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize today to start of day in UTC

    const todayExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setUTCHours(0, 0, 0, 0); // Normalize expense date to start of day in UTC
        return expenseDate.getTime() === today.getTime();
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    return {
      totalExpenses,
      expenseCount,
      todayExpenses,
      monthlyExpenses
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} /> 
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      <div className="pt-16">
        <main className="pt-6 lg:pt-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
            <BreadcrumbNavigation />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Tracking Pengeluaran</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Kelola dan pantau pengeluaran bisnis untuk analisis keuangan yang akurat
                </p>
              </div>
            </div>
            <ExpenseSummaryCard {...summaryMetrics} />
            <ExpenseEntryForm onAddExpense={handleAddExpense} isLoading={isLoading} userRole={userRole} />
            {expenses?.length > 0 && <ExpenseAnalytics expenses={expenses} />}
            <ExpenseHistoryTable
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onBulkDelete={handleBulkDelete}
              onExportData={handleExportData}
              onEditExpense={handleOpenEditModal} // Pass the handler
              isLoading={isLoading}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        expense={editingExpense}
        onUpdateExpense={handleUpdateExpense}
        isLoading={isLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
          <div className="bg-white rounded-lg shadow-elevation-3 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Icon name="AlertTriangle" size={24} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Konfirmasi Hapus Pengeluaran</h3>
              </div>
              
              <p className="text-text-secondary mb-6">
                Apakah Anda yakin ingin menghapus semua pengeluaran? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirmModal(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkDelete(true)}
                  className="flex-1"
                >
                  Hapus Semua
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracking;