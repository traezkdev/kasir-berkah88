import React, { useState, useEffect } from 'react';
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

const apiUrl = import.meta.env.VITE_API_URL;

const ExpenseTracking = ({ headerTitle }) => {
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

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
      if (result.message === 'success') {
        fetchExpenses(); // Refetch to get the latest list
      } else {
        console.error('Failed to add expense:', result.error);
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
    if (confirm('Apakah Anda yakin ingin menghapus semua data pengeluaran? Aksi ini tidak dapat dibatalkan.')) {
      try {
        const response = await authFetch(`${apiUrl}/api/expenses`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.message === 'all deleted') {
          fetchExpenses(); // Refetch to show an empty list
        } else {
          console.error('Failed to bulk delete expenses:', result.error);
        }
      } catch (error) {
        console.error('Error bulk deleting expenses:', error);
      }
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

  const handleExportData = (format) => {
    // ... (existing export logic) ...
  };

  const calculateSummaryMetrics = () => {
    const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const expenseCount = expenses?.length;

    const today = new Date();
    const todayString = today.toDateString();
    const todayExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === todayString;
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
            <ExpenseEntryForm onAddExpense={handleAddExpense} isLoading={isLoading} />
            {expenses?.length > 0 && <ExpenseAnalytics expenses={expenses} />}
            <ExpenseHistoryTable
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onBulkDelete={handleBulkDelete}
              onExportData={handleExportData}
              onEditExpense={handleOpenEditModal} // Pass the handler
              isLoading={isLoading}
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
    </div>
  );
};

export default ExpenseTracking;