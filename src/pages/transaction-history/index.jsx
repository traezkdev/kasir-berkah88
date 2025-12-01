
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import BulkActions from './components/BulkActions';
import Pagination from '../../components/ui/Pagination';
import TransactionReceiptModal from './components/TransactionReceiptModal'; // Import the modal
import EditTransactionModal from './components/EditTransactionModal'; // Import the new edit modal
import TransactionChart from './components/TransactionChart'; // Import TransactionChart
import Icon from '../../components/AppIcon'; // Import Icon for the delete confirmation modal
import Button from '../../components/ui/Button'; // Import Button for the delete confirmation modal


import MetricsCard from '../main-dashboard/components/MetricsCard'; // Import MetricsCard
import authFetch from '../../utils/authFetch';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { prepareTransactionDataForExport } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';



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
    amountRange: 'all'
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
  const [chartFilterType, setChartFilterType] = useState('daily');
  // Removed currentDailyDate and its handlers as chart will now display all data for the selected period

  const [allTransactionsForChart, setAllTransactionsForChart] = useState([]); // New state for chart data

  const navigate = useNavigate();

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
  }, [currentPage, dateRange]);

  // Fetch all transactions for the chart whenever dateRange changes
  useEffect(() => {
    fetchAllTransactionsForChart();
  }, [dateRange]);

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

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
  };

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

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(transaction => transaction.payment_method === filters.paymentMethod);
    }

    // Amount range filter
    if (filters.amountRange !== 'all') {
      filtered = filtered.filter(transaction => {
        const amount = transaction.total;
        switch (filters.amountRange) {
          case '0-50000':
            return amount >= 0 && amount <= 50000;
          case '50000-100000':
            return amount > 50000 && amount <= 100000;
          case '100000-200000':
            return amount > 100000 && amount <= 200000;
          case '200000+':
            return amount > 200000;
          default:
            return true;
        }
      });
    }
    // Date range filtering and sorting are now done on the backend.
    return filtered;
  }, [transactions, searchTerm, filters]);

  // Summary stats are now based on the total items from pagination
  const summaryStats = useMemo(() => {
    const totalTransactions = pagination?.totalItems || 0;
    // Note: The stats below are calculated on the full dataset and would require a separate, unfiltered API call for full accuracy.
    // For this implementation, we will show the total count from pagination, but revenue/meal count will be for the current page only.
    const totalRevenueOnPage = transactions.filter(t => t.payment_method !== 'Makan Karyawan').reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const employeeMealCountOnPage = transactions.filter(t => t.payment_method === 'Makan Karyawan').length;

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

    const handleOpenDeleteConfirm = (transactionId) => {
        setTransactionToDeleteId(transactionId);
        setShowDeleteConfirm(true);
    };

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const getEndOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const todayStart = getStartOfDay(new Date()); // Get start of today in local time
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1); // Derives yesterday directly from todayStart

    const getYesterdayRange = () => {
      return { start: yesterdayStart, end: getEndOfDay(yesterdayStart) };
    };

    const getThisWeekRange = () => {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      return { start: getStartOfDay(startOfWeek), end: getEndOfDay(new Date()) };
    };

    const getThisMonthRange = () => {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: getStartOfDay(startOfMonth), end: getEndOfDay(new Date()) };
    };

    const calculateRevenueForPeriod = (transactions, startDate, endDate, debugLabel = '') => {
      let sum = 0;
      transactions
        .filter(t => t.payment_method !== 'Makan Karyawan')
        .filter(t => {
          const transactionDate = new Date(t.timestamp);
          const isIncluded = transactionDate >= startDate && transactionDate <= endDate;
          return isIncluded;
        })
        .forEach(t => {
          sum += parseFloat(t.total || 0);
        });
        return sum;
    };

    const todayRange = { start: getStartOfDay(today), end: getEndOfDay(today) };
    const yesterdayRange = getYesterdayRange();
    const thisWeekRange = getThisWeekRange();
    const thisMonthRange = getThisMonthRange();

    const revenueToday = calculateRevenueForPeriod(allTransactionsForChart, todayRange.start, todayRange.end);
    const revenueYesterday = calculateRevenueForPeriod(allTransactionsForChart, yesterdayRange.start, yesterdayRange.end);
    const revenueThisWeek = calculateRevenueForPeriod(allTransactionsForChart, thisWeekRange.start, thisWeekRange.end);
    const revenueThisMonth = calculateRevenueForPeriod(allTransactionsForChart, thisMonthRange.start, thisMonthRange.end);

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
  }, [allTransactionsForChart]);


  const transactionMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const getEndOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const todayStart = getStartOfDay(new Date()); // Get start of today in local time
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1); // Derives yesterday directly from todayStart

    const getYesterdayRange = () => {
      return { start: yesterdayStart, end: getEndOfDay(yesterdayStart) };
    };

    const getThisWeekRange = () => {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as per default getDay(). Adjust if week starts Monday
      return { start: getStartOfDay(startOfWeek), end: getEndOfDay(new Date()) };
    };

    const getThisMonthRange = () => {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: getStartOfDay(startOfMonth), end: getEndOfDay(new Date()) };
    };

    const calculateTransactionCountForPeriod = (transactions, startDate, endDate) => {
      let count = 0;
      transactions
        .filter(t => {
          const transactionDate = new Date(t.timestamp);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
        .forEach(() => {
          count++;
        });
      return count;
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
        icon: 'ReceiptText', // A new icon would be good, like for receipts
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
  }, [allTransactionsForChart]);


  return (

    <div className="min-h-screen">

      {theme === 'default' && <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />}

      <main className={`${theme === 'default' ? 'pt-16' : ''} pb-20 lg:pb-8`}>

        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 py-6" : ""}>

          <div className="mb-6">

            <BreadcrumbNavigation customPath={breadcrumbPath} />

            <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary mt-2">

              Riwayat Transaksi

            </h1>

            <p className="text-text-secondary mt-1">

              Kelola dan pantau semua transaksi penjualan Anda

            </p>

          </div>

          {/* Revenue Metrics Section */}
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-text-primary mb-4">
              Ringkasan Pendapatan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {revenueMetrics.map((metric, index) => (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {transactionMetrics.map((metric, index) => (
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
    </div>

  );

};



export default TransactionHistory;


