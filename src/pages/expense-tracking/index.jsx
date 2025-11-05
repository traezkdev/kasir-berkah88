import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination'; // Import Pagination component

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
import { formatInTimeZone } from 'date-fns-tz';
import { startOfWeek, endOfWeek } from 'date-fns';

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const ExpenseTracking = ({ headerTitle }) => {
  const { theme } = useTheme();
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
  const [password, setPassword] = useState(''); // State for password
  const [passwordError, setPasswordError] = useState(''); // State for password error

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Display 20 items per page

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

  const handleBulkDelete = async () => {
    setShowBulkDeleteConfirmModal(true);
    setPassword('');
    setPasswordError('');
  };

  const handleConfirmBulkDelete = async () => {
    if (password !== 'berkah88') {
      setPasswordError('Kata sandi salah. Silakan coba lagi.');
      return;
    }

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
      setPassword('');
      setPasswordError('');
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
    const todayFormatted = formatInTimeZone(today, 'Asia/Jakarta', 'yyyy-MM-dd');

    const todayExpenses = expenses?.filter(expense => {
        const expenseDateFormatted = formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', 'yyyy-MM-dd');
        return expenseDateFormatted === todayFormatted;
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 }); // Sunday as end of week

    const weeklyExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfCurrentWeek && expenseDate <= endOfCurrentWeek;
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      // Adjust for timezone issues by comparing dates in the correct timezone
      return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
    });

    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const monthlyExpenseCount = monthlyExpenses.length;

    return {
      totalExpenses,
      expenseCount,
      todayExpenses,
      weeklyExpenses,
      monthlyExpenses: monthlyExpenseTotal, // Rename to avoid conflict
      monthlyExpenseCount
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Get current expenses for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = expenses.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      <div className={`${theme === 'default' ? 'pt-16' : 'pt-16'}`}>
        <main className="pb-20 lg:pb-8">
          <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 space-y-6" : "space-y-6"}>
            <BreadcrumbNavigation className="mt-4" />
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
              expenses={currentExpenses} // Pass currentExpenses for pagination
              onDeleteExpense={handleDeleteExpense}
              onBulkDelete={handleBulkDelete}
              onExportData={handleExportData}
              onEditExpense={handleOpenEditModal} // Pass the handler
              isLoading={isLoading}
              userRole={userRole}
            />
            <div className="flex justify-center mt-4">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={expenses.length}
                paginate={paginate}
                currentPage={currentPage}
              />
            </div>
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
              
              <div className="mb-6">
                <p className="text-text-secondary mb-3">
                  Apakah Anda yakin ingin menghapus semua pengeluaran? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <p className="text-sm text-destructive mt-1">
                    Semua data pengeluaran akan hilang secara permanen.
                  </p>
                </div>
                
                {/* Password Input */}
                <div>
                  <label htmlFor="password-confirm" className="text-sm font-medium text-text-primary">
                    Masukkan kata sandi untuk konfirmasi:
                  </label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi"
                    className="mt-2"
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive mt-2">{passwordError}</p>
                  )}
                </div>
              </div>

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
                  onClick={handleConfirmBulkDelete}
                  className="flex-1"
                >
                  Ya, Hapus Semua
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