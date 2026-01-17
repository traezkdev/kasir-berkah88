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
import { savePendingExpense } from '../../utils/offlinePersistence';

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const ExpenseTracking = ({ headerTitle }) => {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState([]); // For paginated table
  const [allExpenses, setAllExpenses] = useState([]); // For summary cards and analytics
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
  const [pagination, setPagination] = useState(null);

  // Filter state (lifted from ExpenseHistoryTable)
  const [dateFilter, setDateFilter] = useState('');
  const [filteredCount, setFilteredCount] = useState(0); // Track filtered expenses count for pagination

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hide after 3 seconds
  };

  // Fetches ALL expenses for summary cards
  const fetchAllExpenses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // No loading state change here to not interfere with table loading
    try {
      const response = await authFetch(`${apiUrl}/api/expenses/all`);
      const data = await response.json();
      if (data.message === 'success') {
        setAllExpenses(data.data);
      } else {
        // console.error('Failed to fetch all expenses:', data.error);
        setAllExpenses([]);
      }
    } catch (error) {
      // console.error('Error fetching all expenses:', error);
      setAllExpenses([]);
    }
  };

  // Fetches paginated expenses for the table
  const fetchExpenses = async (page) => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses?page=${page}&limit=${itemsPerPage}`);
      const data = await response.json();
      if (data.message === 'success') {
        setExpenses(data.data);
        setPagination(data.pagination); // Set pagination data
      } else {
        // console.error('Failed to fetch expenses:', data.error);
        setExpenses([]);
      }
    } catch (error) {
      // console.error('Error fetching expenses:', error);
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
    fetchAllExpenses();
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
    fetchExpenses(currentPage);
  }, [currentPage]);

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

    // Check if offline
    if (!navigator.onLine) {
      try {
        await savePendingExpense(expenseData);
        showNotification('Sedang offline. Pengeluaran disimpan di perangkat!', 'success');
        // We can't easily update local state without server ID, 
        // but for expenses we can just wait for sync.
        setIsLoading(false);
        return;
      } catch (err) {
        showNotification('Gagal menyimpan pengeluaran offline.', 'error');
        setIsLoading(false);
        return;
      }
    }

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
          fetchAllExpenses(); // Refetch all for summary
          if (currentPage === 1) {
            fetchExpenses(1);
          } else {
            setCurrentPage(1); // This will trigger the useEffect for fetching paginated expenses
          }
        } else {
          // console.error('Failed to add expense:', result.error || 'Unknown error');
        }
      } else {
        console.error('Failed to add expense (HTTP error):', result.error || result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Network error, attempting offline save:', error);
      try {
        await savePendingExpense(expenseData);
        showNotification('Koneksi bermasalah. Pengeluaran disimpan offline.', 'success');
      } catch (offlineErr) {
        showNotification('Gagal menyimpan pengeluaran. Periksa koneksi internet.', 'error');
      }
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
        fetchExpenses(currentPage); // Refetch current page for table
        fetchAllExpenses(); // Refetch all for summary
        handleCloseEditModal();
      } else {
        // console.error('Failed to update expense:', result.error);
      }
    } catch (error) {
      // console.error('Error updating expense:', error);
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
        fetchExpenses(currentPage); // Refetch to update the list
        fetchAllExpenses(); // Refetch all for summary
      } else {
        // console.error('Failed to delete expense:', result.error);
      }
    } catch (error) {
      // console.error('Error deleting expense:', error);
    }
  };

  const handleBulkDelete = async () => {
    setShowBulkDeleteConfirmModal(true);
    setPassword('');
    setPasswordError('');
  };

  const handleConfirmBulkDelete = async () => {
    setPasswordError(''); // Reset error message

    try {
      const response = await authFetch(`${apiUrl}/api/expenses/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (response.ok) {
        fetchAllExpenses(); // Refetch all for summary
        if (currentPage === 1) {
          fetchExpenses(1);
        } else {
          setCurrentPage(1);
        }
        showNotification('Semua pengeluaran berhasil dihapus!', 'success');
        setShowBulkDeleteConfirmModal(false); // Close modal on success
      } else {
        // Set password error from server response
        setPasswordError(result.error || 'Gagal menghapus pengeluaran.');
        // console.error('Failed to bulk delete expenses:', result.error);
      }
    } catch (error) {
      // console.error('Error bulk deleting expenses:', error);
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
      // Intentionally using allExpenses for export
      const dataToExport = prepareExpenseDataForExport(allExpenses);
      if (format === 'excel') {
        exportToExcel(dataToExport, 'Laporan_Pengeluaran');
        showNotification('Data pengeluaran berhasil diekspor ke Excel!', 'success');
      } else if (format === 'pdf') {
        exportToPdf(dataToExport, 'Laporan_Pengeluaran');
        showNotification('Data pengeluaran berhasil diekspor ke PDF!', 'success');
      }
    } catch (error) {
      // console.error('Error exporting data:', error);
      showNotification('Gagal mengekspor data. Silakan coba lagi.', 'error');
    }
  };

  const calculateSummaryMetrics = () => {
    const totalExpenses = allExpenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const expenseCount = allExpenses?.length;

    // Determine reference date: use filter date if exists, otherwise use today
    const referenceDate = dateFilter ? new Date(dateFilter) : new Date();
    const referenceDateFormatted = formatInTimeZone(referenceDate, 'Asia/Jakarta', 'yyyy-MM-dd');

    // Calculate "today" expenses (or filtered date expenses)
    const todayExpenses = allExpenses?.filter(expense => {
      const expenseDateFormatted = formatInTimeZone(new Date(expense.date), 'Asia/Jakarta', 'yyyy-MM-dd');
      return expenseDateFormatted === referenceDateFormatted;
    })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    // Calculate week expenses for the week containing the reference date
    const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday as start of week
    const endOfCurrentWeek = endOfWeek(referenceDate, { weekStartsOn: 1 }); // Sunday as end of week

    const weeklyExpenses = allExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfCurrentWeek && expenseDate <= endOfCurrentWeek;
    })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    // Calculate month expenses for the month containing the reference date
    const monthlyExpenses = allExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === referenceDate.getMonth() && expenseDate.getFullYear() === referenceDate.getFullYear();
    });

    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const monthlyExpenseCount = monthlyExpenses.length;

    return {
      totalExpenses,
      expenseCount,
      todayExpenses,
      weeklyExpenses,
      monthlyExpenses: monthlyExpenseTotal,
      monthlyExpenseCount,
      filterDate: dateFilter, // Pass filter date to summary card
      referenceDate, // Pass reference date for label formatting
      weekStart: startOfCurrentWeek,
      weekEnd: endOfCurrentWeek
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : ''}`}>
      {theme === 'default' && (
        <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />
      )}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}
      <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pt-2 space-y-6 lg:space-y-8" : "space-y-6 lg:space-y-8"}>
          <div className="mb-8 lg:mb-6">
            <div className="mb-4 hidden md:block">
              <BreadcrumbNavigation />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                  Tracking Pengeluaran
                </h1>
                <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
                <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
                  Kelola dan pantau pengeluaran bisnis Anda
                </p>
              </div>
            </div>
          </div>
          <ExpenseSummaryCard {...summaryMetrics} />
          <ExpenseEntryForm onAddExpense={handleAddExpense} isLoading={isLoading} userRole={userRole} />
          {allExpenses?.length > 0 && <ExpenseAnalytics expenses={allExpenses} />}
          <ExpenseHistoryTable
            expenses={allExpenses} // Use allExpenses for proper filtering
            onDeleteExpense={handleDeleteExpense}
            onBulkDelete={handleBulkDelete}
            onExportData={handleExportData}
            onEditExpense={handleOpenEditModal} // Pass the handler
            isLoading={isLoading}
            userRole={userRole}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onFilteredCountChange={setFilteredCount}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
          <div className="flex justify-center mt-4">
            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={filteredCount > 0 ? filteredCount : (pagination?.totalItems || 0)}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>
        </div>
      </main>
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        expense={editingExpense}
        onUpdateExpense={handleUpdateExpense}
        isLoading={isLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      {
        showBulkDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-elevation-3 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Icon name="AlertTriangle" size={24} className="text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary dark:text-white">Konfirmasi Hapus Pengeluaran</h3>
                </div>

                <div className="mb-6">
                  <p className="text-text-secondary dark:text-gray-300 mb-3">
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
                    <label htmlFor="password-confirm" className="text-sm font-medium text-text-primary dark:text-gray-300">
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
        )
      }
    </div >
  );
};

export default ExpenseTracking;