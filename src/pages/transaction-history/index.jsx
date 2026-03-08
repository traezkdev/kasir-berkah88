
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import BulkActions from './components/BulkActions';
import Pagination from '../../components/ui/Pagination';
import TransactionReceiptModal from './components/TransactionReceiptModal'; // Import the modal
import EditTransactionModal from './components/EditTransactionModal'; // Import the new edit modal
import DailyRecapPopup from './components/DailyRecapPopup'; // Import the daily recap popup
import TransactionChart from './components/TransactionChart'; // Import TransactionChart
import Icon from '../../components/AppIcon'; // Import Icon for the delete confirmation modal
import Button from '../../components/ui/Button'; // Import Button for the delete confirmation modal
import NotificationBell from '../../components/ui/NotificationBell';


import MetricsCard from '../main-dashboard/components/MetricsCard'; // Import MetricsCard
import authFetch from '../../utils/authFetch';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { prepareTransactionDataForExport } from '../../utils/exportUtils';
import * as XLSX from 'xlsx-js-style';



const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })?.format(amount);
};

const TransactionHistory = ({ headerTitle }) => {
  const { theme } = useTheme();
  const exportContentRef = useRef(null);
  const [transactions, setTransactions] = useState([]); // Will hold one page of data
  const [pagination, setPagination] = useState(null); // For pagination info from backend
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    paymentMethod: 'all',
    amountRange: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Fixed to match backend

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isRecapPopupOpen, setIsRecapPopupOpen] = useState(false);
  const [chartFilterType, setChartFilterType] = useState('daily');
  // Removed currentDailyDate and its handlers as chart will now display all data for the selected period

  const [allTransactionsForChart, setAllTransactionsForChart] = useState([]); // New state for chart data
  // allTransactionsData state removed


  // Removed fetchAllDataForMetrics as we now use fetchAllTransactionsForChart for everything


  const navigate = useNavigate();
  const location = useLocation();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowStickyHeader(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState(null);

  // Function to fetch all transactions for the chart based on date range and filter type
  const fetchAllTransactionsForChart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const params = new URLSearchParams();

    // The filter type (daily, weekly, monthly) will be handled client-side in TransactionChart
    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate);
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate);
    }
    // Add paymentMethod to query params
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.append('paymentMethod', filters.paymentMethod);
    }

    // Add filterClosed to query params to hide closed sessions in metrics cards
    params.append('filterClosed', 'true');

    try {
      // Request all transactions by not setting limit
      const url = `${apiUrl}/api/transactions/all?${params.toString()}`;
      const response = await authFetch(url); // Use /all endpoint for non-paginated
      const data = await response.json();
      if (data.message === 'success') {
        const parsedTransactions = data.data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
          items: Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]')
        }));
        setAllTransactionsForChart(parsedTransactions);
      } else {
        console.error('Failed to fetch all transactions for chart:', data.error);
        setAllTransactionsForChart([]);
      }
    } catch (error) {
      console.error('Error fetching all transactions for chart:', error);
      setAllTransactionsForChart([]);
    }
  };

  // Load transactions from API based on page and filters (for the table)
  const fetchPaginatedTransactions = async (page) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const params = new URLSearchParams({
      page: page,
      limit: itemsPerPage,
    });
    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate);
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate);
    }
    // Add paymentMethod to query params
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.append('paymentMethod', filters.paymentMethod);
    }

    // Add Amount Range to query params
    let minTotal = null;
    let maxTotal = null;

    if (filters.amountRange && filters.amountRange !== 'all') {
      if (filters.amountRange === 'custom') {
        if (filters.minAmount) minTotal = filters.minAmount;
        if (filters.maxAmount) maxTotal = filters.maxAmount;
      } else {
        // Parse predefined range
        if (filters.amountRange.includes('+')) {
          minTotal = parseInt(filters.amountRange.replace('+', ''));
        } else {
          const parts = filters.amountRange.split('-');
          if (parts.length === 2) {
            minTotal = parseInt(parts[0]);
            maxTotal = parseInt(parts[1]);
          }
        }
      }
    }

    if (minTotal !== null) params.append('minTotal', minTotal);
    if (maxTotal !== null) params.append('maxTotal', maxTotal);

    try {
      const response = await authFetch(`${apiUrl}/api/transactions?${params.toString()}`);
      const data = await response.json();
      if (data.message === 'success') {
        const parsedTransactions = data.data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
          items: Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]')
        }));
        setTransactions(parsedTransactions);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch transactions:', data.error);
        setTransactions([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setPagination(null);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPaginatedTransactions(currentPage);
  }, [currentPage, dateRange, filters.paymentMethod, filters.amountRange, filters.minAmount, filters.maxAmount]); // Add filters dependencies

  // Fetch all transactions for the chart whenever dateRange changes
  useEffect(() => {
    fetchAllTransactionsForChart();
  }, [dateRange, filters.paymentMethod]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in TransactionHistory:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  const handleTransactionClick = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptModalOpen(true);
  }, []);

  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleEditTransaction = useCallback((transaction) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleOpenRecapPopup = () => setIsRecapPopupOpen(true);
  const handleCloseRecapPopup = () => setIsRecapPopupOpen(false);

  const handleUpdateTransaction = async (id, updatedData) => {
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (result.message === 'success') {
        fetchPaginatedTransactions(currentPage); // Refresh the current page
        handleCloseEditModal();
      } else {
        console.error('Failed to update transaction:', result.error);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Client-side filtering is now applied only on the current page's data
  const currentItems = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.items.some(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        transaction.total.toString().includes(searchTerm) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment method filter is now handled by backend
    // if (filters.paymentMethod !== 'all') {
    //   filtered = filtered.filter(transaction => transaction.payment_method === filters.paymentMethod);
    // }

    // Amount range filter is now handled by backend
    // if (filters.amountRange !== 'all') { ... }
    // Date range filtering and sorting are now done on the backend.
    return filtered;
  }, [transactions, searchTerm, filters]);

  // Summary stats are now based on the total items from pagination
  const summaryStats = useMemo(() => {
    const totalTransactions = pagination?.totalItems || 0;
    // Note: The stats below are calculated on the full dataset and would require a separate, unfiltered API call for full accuracy.
    // For this implementation, we will show the total count from pagination, but revenue/meal count will be for the current page only.
    const totalRevenueOnPage = transactions.filter(t => t.payment_method !== 'employee_meal').reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const employeeMealCountOnPage = transactions.filter(t => t.payment_method === 'employee_meal').length;

    return {
      totalTransactions,
      totalRevenue: totalRevenueOnPage,
      employeeMealCount: employeeMealCountOnPage
    };
  }, [transactions, pagination]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleNextDayRange = () => {
    // Removed currentDailyDate and its handlers
  };

  const handlePrevDayRange = () => {
    // Removed currentDailyDate and its handlers
  };

  const handleOpenDeleteConfirm = useCallback((transactionId) => {
    setTransactionToDeleteId(transactionId);
    setShowDeleteConfirm(true);
  }, []);

  const handleCloseDeleteConfirm = () => {
    setTransactionToDeleteId(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteTransaction = async () => { // Modified to use transactionToDeleteId
    if (!transactionToDeleteId) return;

    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${transactionToDeleteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'deleted') {
        fetchPaginatedTransactions(currentPage); // Refetch current page
        handleCloseDeleteConfirm(); // Close the modal
      } else {
        console.error('Failed to delete transaction:', data.error);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleClearAllTransactions = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'all deleted') {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          fetchPaginatedTransactions(1);
        }
      } else {
        console.error('Failed to clear transactions:', data.error);
      }
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  const handleExportTransactions = async (format, startDate, endDate) => { // Modified signature
    setIsExporting(true);

    try {
      // New: Fetch all transactions for the specified date range from the backend
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const url = `${apiUrl}/api/transactions/all?${params.toString()}`;
      const response = await authFetch(url);
      const data = await response.json();

      let transactionsToExport = [];
      if (data.message === 'success') {
        transactionsToExport = data.data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
          items: Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]')
        }));
      } else {
        console.error('Failed to fetch all transactions for export:', data.error);
        setIsExporting(false);
        return; // Stop execution if data fetch fails
      }

      const dataToExport = prepareTransactionDataForExport(transactionsToExport); // Use fetched data

      // Ensure totalRevenue is calculated from transactionsToExport
      const totalRevenue = transactionsToExport?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);

      if (format === 'excel') {
        const ws_data = [
          ["Laporan Riwayat Transaksi"], // Title
          [], // Empty row for spacing
          Object.keys(dataToExport[0] || {}), // Headers
          ...dataToExport.map(row => Object.values(row)) // Data
        ];

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Merge title cells
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Object.keys(dataToExport[0] || {}).length - 1 } }];

        // Style for title
        if (ws['A1']) {
          ws['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }

        // Style for headers (row 2, 0-indexed)
        const headerRowIndex = 2;
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } }, // White text
          fill: { fgColor: { rgb: "000080" } }, // Dark blue background
          border: {
            top: { style: "thin", color: { auto: 1 } },
            bottom: { style: "thin", color: { auto: 1 } },
            left: { style: "thin", color: { auto: 1 } },
            right: { style: "thin", color: { auto: 1 } }
          }
        };
        Object.keys(dataToExport[0] || {}).forEach((_, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
          if (ws[cellRef]) {
            ws[cellRef].s = headerStyle;
          }
        });

        // Style for data cells (rows from 3 onwards)
        const dataStyle = {
          border: {
            top: { style: "thin", color: { auto: 1 } },
            bottom: { style: "thin", color: { auto: 1 } },
            left: { style: "thin", color: { auto: 1 } },
            right: { style: "thin", color: { auto: 1 } }
          }
        };
        for (let r = headerRowIndex + 1; r < ws_data.length; r++) {
          for (let c = 0; c < (Object.keys(dataToExport[0] || {}).length); c++) {
            const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
            if (ws[cellRef]) {
              ws[cellRef].s = dataStyle;
            }
          }
        }

        // Auto-width columns
        const max_width = ws_data[headerRowIndex].map((header, i) => Math.max(...ws_data.map(row => (row[i] ? row[i].toString().length : 0)), header.length));
        ws['!cols'] = max_width.map(w => ({ wch: w + 2 })); // Add some padding

        // Add footer with total transactions
        const totalTransactions = transactionsToExport?.length; // Use transactionsToExport

        const footerRowIndex = ws_data.length;
        ws_data.push([]); // Empty row for spacing
        ws_data.push([`Total Transaksi: ${totalTransactions}`]);
        ws_data.push([`Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`]);

        // Update worksheet with footer data
        XLSX.utils.sheet_add_aoa(ws, ws_data.slice(footerRowIndex), { origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
        XLSX.writeFile(wb, `riwayat-transaksi-${new Date()?.toISOString()?.split('T')?.[0]}.xlsx`);
      } else if (format === 'pdf') {

        const doc = new jsPDF();

        // Add header
        doc.setFontSize(18);
        doc.text("Riwayat Transaksi", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Tanggal Export: ${new Date().toLocaleDateString()}`, 14, 30);

        // Prepare table data
        const headers = [
          'ID Transaksi',
          'Tanggal',
          'Waktu',
          'Total',
          'Tipe',
          'Item Terjual',
          'Kasir',
        ];
        const body = dataToExport.map(row => [
          row['ID Transaksi'],
          row['Tanggal'],
          row['Waktu'],
          row['Total'],
          row['Tipe'],
          row['Item Terjual'],
          row['Kasir'],
        ]);

        autoTable(doc, {
          startY: 40,
          head: [headers],
          body: body,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [20, 83, 45], // Dark green
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240],
          },
          didDrawPage: function (data) {
            // Footer
            let str = "Halaman " + doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          }
        });

        let finalY = doc.lastAutoTable.finalY;

        doc.text(`Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`, 14, finalY + 17);
        doc.text(`Total Penjualan: Rp ${totalRevenue.toLocaleString('id-ID')}`, 14, finalY + 24);

        doc.save(`riwayat-transaksi-${new Date()?.toISOString()?.split('T')?.[0]}.pdf`);
      }

      console.log(`Exported ${transactionsToExport?.length} transactions as ${format}`); // Use transactionsToExport length
    } catch (error) {

      console.error('Export failed:', error);

    } finally {

      setIsExporting(false);

    }

  };



  const breadcrumbPath = [

    { label: 'Dashboard', path: '/main-dashboard', isActive: false },

    { label: 'Riwayat Transaksi', path: '/transaction-history', isActive: true }

  ];




  const revenueMetrics = useMemo(() => {
    const calculateRevenue = (transactions) => {
      if (!transactions || transactions.length === 0) return 0;

      // Filter out employee meals for revenue AND filter out closed book transactions
      const validTransactions = transactions.filter(t => t.payment_method !== 'employee_meal' && !t.closing_session_id);
      return validTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    };

    if (dateRange.startDate && dateRange.endDate) {
      // Summary Mode for Selected Range
      const totalRevenue = calculateRevenue(allTransactionsForChart);

      return [
        {
          title: 'Pendapatan (Periode Ini)',
          value: formatCurrency(totalRevenue),
          icon: 'TrendingUp',
          color: 'success',
          description: `Total pendapatan dari ${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
        }
      ];
    }

    // Default Mode (Today, Yesterday, Week, Month)
    // Note: allTransactionsForChart here contains ALL transactions (filtered by payment method if applied)
    // We need to filter by date ranges locally.

    const now = new Date();
    // Use reliable .toDateString() for daily metrics
    const todayDateString = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDateString = yesterday.toDateString();

    const calculateDailyRevenue = (transactions, targetDateString) => {
      if (!transactions || transactions.length === 0) return 0;
      let filtered = transactions.filter(t => new Date(t.timestamp).toDateString() === targetDateString);
      return calculateRevenue(filtered);
    };

    const revenueToday = calculateDailyRevenue(allTransactionsForChart, todayDateString);
    const revenueYesterday = calculateDailyRevenue(allTransactionsForChart, yesterdayDateString);

    const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const getEndOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const getThisWeekRange = () => {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      return { start: getStartOfDay(startOfWeek), end: getEndOfDay(now) };
    };

    const getThisMonthRange = () => {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: getStartOfDay(startOfMonth), end: getEndOfDay(now) };
    };

    const calculateRangeRevenue = (transactions, startDate, endDate) => {
      if (!transactions || transactions.length === 0) return 0;
      let filtered = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      return calculateRevenue(filtered);
    };

    const thisWeekRange = getThisWeekRange();
    const thisMonthRange = getThisMonthRange();
    const revenueThisWeek = calculateRangeRevenue(allTransactionsForChart, thisWeekRange.start, thisWeekRange.end);
    const revenueThisMonth = calculateRangeRevenue(allTransactionsForChart, thisMonthRange.start, thisMonthRange.end);

    return [
      {
        title: 'Pendapatan Hari Ini',
        value: formatCurrency(revenueToday),
        icon: 'TrendingUp',
        color: 'success',
        description: 'Total pendapatan dari transaksi hari ini.'
      },
      {
        title: 'Pendapatan Kemarin',
        value: formatCurrency(revenueYesterday),
        icon: 'DollarSign',
        color: 'info',
        description: 'Total pendapatan dari transaksi kemarin.'
      },
      {
        title: 'Pendapatan Minggu Ini',
        value: formatCurrency(revenueThisWeek),
        icon: 'Calendar',
        color: 'primary',
        description: 'Total pendapatan dari transaksi minggu ini.'
      },
      {
        title: 'Pendapatan Bulan Ini',
        value: formatCurrency(revenueThisMonth),
        icon: 'CalendarDays',
        color: 'accent',
        description: 'Total pendapatan dari transaksi bulan ini.'
      }
    ];
  }, [allTransactionsForChart, dateRange]);

  const transactionMetrics = useMemo(() => {

    // Helper to calculate counts
    const calculateCount = (transactions) => {
      if (!transactions) return 0;
      // Filter out closed book transactions
      return transactions.filter(t => !t.closing_session_id).length;
    };

    if (dateRange.startDate && dateRange.endDate) {
      // Summary Mode for Selected Range
      const totalCount = calculateCount(allTransactionsForChart);

      return [
        {
          title: 'Total Transaksi (Periode Ini)',
          value: totalCount,
          icon: 'ReceiptText',
          color: 'success',
          description: `Total transaksi dari ${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
        }
      ];
    }

    // Default Mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const getEndOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const todayStart = getStartOfDay(new Date());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const getYesterdayRange = () => {
      return { start: yesterdayStart, end: getEndOfDay(yesterdayStart) };
    };

    const getThisWeekRange = () => {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { start: getStartOfDay(startOfWeek), end: getEndOfDay(new Date()) };
    };

    const getThisMonthRange = () => {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: getStartOfDay(startOfMonth), end: getEndOfDay(new Date()) };
    };

    const calculateTransactionCountForPeriod = (transactions, startDate, endDate) => {
      let filtered = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      return filtered.length;
    };

    const todayRange = { start: getStartOfDay(today), end: getEndOfDay(today) };
    const yesterdayRange = getYesterdayRange();
    const thisWeekRange = getThisWeekRange();
    const thisMonthRange = getThisMonthRange();

    const transactionsToday = calculateTransactionCountForPeriod(allTransactionsForChart, todayRange.start, todayRange.end);
    const transactionsYesterday = calculateTransactionCountForPeriod(allTransactionsForChart, yesterdayRange.start, yesterdayRange.end);
    const transactionsThisWeek = calculateTransactionCountForPeriod(allTransactionsForChart, thisWeekRange.start, thisWeekRange.end);
    const transactionsThisMonth = calculateTransactionCountForPeriod(allTransactionsForChart, thisMonthRange.start, thisMonthRange.end);

    return [
      {
        title: 'Transaksi Hari Ini',
        value: transactionsToday,
        icon: 'ReceiptText',
        color: 'success',
        description: 'Jumlah transaksi yang terjadi hari ini.'
      },
      {
        title: 'Transaksi Kemarin',
        value: transactionsYesterday,
        icon: 'Receipt',
        color: 'info',
        description: 'Jumlah transaksi yang terjadi kemarin.'
      },
      {
        title: 'Transaksi Minggu Ini',
        value: transactionsThisWeek,
        icon: 'CalendarDays',
        color: 'primary',
        description: 'Jumlah transaksi yang terjadi minggu ini.'
      },
      {
        title: 'Transaksi Bulan Ini',
        value: transactionsThisMonth,
        icon: 'CalendarCheck',
        color: 'accent',
        description: 'Jumlah transaksi yang terjadi bulan ini.'
      }
    ];
  }, [allTransactionsForChart, dateRange]);


  return (

    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : ''}`}>

      {/* Custom Mobile Header */}
      {theme === 'default' && (
        <>
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />
          </div>

          {/* Mobile Header */}
          <div
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 lg:hidden gpu-acceleration ${showStickyHeader ? 'shadow-sm py-3' : 'bg-transparent py-5'}`}
            style={showStickyHeader ? { backgroundColor: '#148FEA' } : {}}
          >
            <div className="px-6 flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-2xl transition-all active:scale-95 ${showStickyHeader ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-sm'}`}
              >
                <Icon name="ChevronLeft" size={24} />
              </button>

              <div className={`text-center transition-all duration-300 ${showStickyHeader ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className="font-black text-white tracking-tight">Riwayat Transaksi</h2>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell size={20} className={`${showStickyHeader ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-sm'}`} />
              </div>
            </div>
          </div>
        </>
      )}

      <main className={`${theme === 'default' ? 'pb-24 lg:pb-8' : 'pb-24 lg:pb-8'}`}>
        {/* Mobile Header Banner (lg:hidden) */}
        {theme === 'default' && (
          <div className="lg:hidden bg-gradient-to-br from-[#118eea] to-[#0d70ba] dark:from-slate-900 dark:to-slate-800 pt-20 pb-14 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>

            {/* Decorative Background Icon */}
            <div className="absolute -right-12 -top-12 text-white/20 -rotate-12 pointer-events-none">
              <Icon name="Receipt" size={200} />
            </div>

            <div className="relative z-10">
              <div>
                <p className="text-[10px] font-black text-blue-100 dark:text-blue-200/60 uppercase tracking-[0.2em] mb-2 opacity-80">Catatan Penjualan</p>
                <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                  Riwayat<br />{pagination?.totalItems > 0 ? `${pagination.totalItems} Transaksi` : 'Transaksi'}
                </h1>
              </div>
            </div>

            <div className="mt-8 flex gap-3 relative z-10">
              <button
                onClick={handleOpenRecapPopup}
                className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20 flex items-center gap-2 active:scale-95 transition-all outline-none"
              >
                <div className="bg-white/20 p-2 rounded-xl text-white">
                  <Icon name="FileText" size={18} />
                </div>
                <span className="font-black text-[11px] text-white uppercase tracking-tight leading-tight text-left">
                  Rekap<br />Harian
                </span>
              </button>
              <button
                onClick={() => handleExportTransactions('pdf', dateRange.startDate, dateRange.endDate)}
                className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20 flex items-center gap-2 active:scale-95 transition-all outline-none"
              >
                <div className="bg-white/20 p-2 rounded-xl text-white">
                  <Icon name="Download" size={18} />
                </div>
                <span className="font-black text-[11px] text-white uppercase tracking-tight leading-tight text-left">
                  Ekspor<br />PDF
                </span>
              </button>
            </div>
          </div>
        )}

        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 space-y-6 lg:space-y-8" : "space-y-6"}>
          {/* Search Bar - Overlapping Header */}


          <div className="hidden lg:block mb-8 lg:mb-6">

            <div className="mb-4 hidden md:block">
              <BreadcrumbNavigation customPath={breadcrumbPath} />
            </div>

            <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                Riwayat Transaksi
              </h1>
            </div>

            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 hidden lg:block"></div>

            <p className="hidden lg:block text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
              Kelola dan pantau semua transaksi penjualan Anda
            </p>

          </div>

          {/* Search Bar - Overlapping Header (Mobile) / Regular (Desktop) */}
          <div className="!-mt-12 lg:mt-0 lg:pt-10 relative z-30 mb-6 px-0 lg:px-0 pt-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Icon name="Search" size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border-transparent shadow-sm rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Revenue Metrics Section */}
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-text-primary mb-4">
              Ringkasan Pendapatan
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {revenueMetrics.slice(0, showAllMetrics || window.innerWidth >= 1024 ? revenueMetrics.length : 2).map((metric, index) => (
                <MetricsCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  description={metric.description}
                />
              ))}
            </div>
          </div>
          {/* End Revenue Metrics Section */}

          {/* Transaction Metrics Section */}
          <div className="mb-6">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {transactionMetrics.slice(0, showAllMetrics || window.innerWidth >= 1024 ? transactionMetrics.length : 1).map((metric, index) => (
                <MetricsCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  description={metric.description}
                />
              ))}
            </div>
            {/* Show More Button - Mobile Only */}
            {(revenueMetrics.length + transactionMetrics.length > 3) && (
              <button
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="lg:hidden mt-4 w-full py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Icon name={showAllMetrics ? "ChevronUp" : "ChevronDown"} size={18} />
                {showAllMetrics ? "Sembunyikan Semua" : `Lihat ${revenueMetrics.length + transactionMetrics.length - 3} Metrik Lainnya`}
              </button>
            )}
          </div>
          {/* End Transaction Metrics Section */}

          <TransactionFilters

            onFilterChange={handleFilterChange}

            onSearch={handleSearch}

            onDateRangeChange={handleDateRangeChange}

            totalTransactions={summaryStats?.totalTransactions}

            totalRevenue={summaryStats?.totalRevenue}

            employeeMealCount={summaryStats?.employeeMealCount}

          />



          <BulkActions
            onClearAllTransactions={handleClearAllTransactions}
            onExportTransactions={handleExportTransactions}
            onOpenRecapPopup={handleOpenRecapPopup}
            transactionCount={currentItems.length}
            isExporting={isExporting}
            userRole={userRole}
          />



          <TransactionTable

            transactions={currentItems}

            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}

            onRowClick={handleTransactionClick}

            isMobile={isMobile}
            userRole={userRole}
            onOpenDeleteConfirm={handleOpenDeleteConfirm} // Pass the new handler

          />

          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={pagination?.totalItems || 0}
            paginate={paginate}
            currentPage={currentPage}
          />



        </div>
      </main>


      <TransactionReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceiptModal}
        transaction={selectedTransaction}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        transaction={transactionToEdit}
        onUpdateTransaction={handleUpdateTransaction}
      />

      <DailyRecapPopup
        isOpen={isRecapPopupOpen}
        onClose={handleCloseRecapPopup}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Hapus Transaksi
              </h3>
            </div>
            <p className="text-text-secondary mb-6">
              Apakah Anda yakin ingin menghapus transaksi #{transactionToDeleteId}?
              Tindakan ini akan memindahkan transaksi ke tong sampah.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseDeleteConfirm}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTransaction}
                className="flex-1"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar for Mobile */}
      {theme === 'default' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-slate-800 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <nav className="flex items-center justify-between h-18 px-4 py-2">
            {[
              { label: 'Dashboard', path: '/main-dashboard', icon: 'LayoutDashboard' },
              { label: 'Penjualan', path: '/transaksi', icon: 'ShoppingCart' },
              { label: 'Menu', path: '/menu-management', icon: 'UtensilsCrossed' },
              { label: 'Pengeluaran', path: '/expense-tracking', icon: 'Receipt' },
              { label: 'Transaksi', path: '/transaction-history', icon: 'ListOrdered' },
            ].map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center justify-center transition-all duration-500 ease-in-out h-12 rounded-2xl relative group active:scale-90
                      ${active
                      ? 'flex-[2.5] bg-blue-600 dark:bg-white text-white dark:text-slate-900 px-4 shadow-lg shadow-blue-500/30 dark:shadow-white/10 hover:brightness-110'
                      : 'flex-1 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <Icon
                      name={item.icon}
                      size={24}
                      className={`transition-colors duration-300 ${active ? 'text-white dark:text-slate-900' : 'text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                    />
                    {active && (
                      <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                        {item.label === 'Dashboard' ? 'Home' : item.label.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Adaptive Glassy Overlay */}
                  {active && (
                    <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-black/5 transition-opacity group-hover:opacity-20" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>

  );

};



export default TransactionHistory;



