import React, { useState, useEffect, useMemo, useRef } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import BulkActions from './components/BulkActions';

import authFetch from '../../utils/authFetch';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { prepareTransactionDataForExport } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';



const apiUrl = import.meta.env.VITE_API_URL;

const TransactionHistory = () => {
  const exportContentRef = useRef(null); // Add this line
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    amountRange: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [logoBase64, setLogoBase64] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/assets/images/no_image.png'); // Path relative to public folder
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to load logo for PDF:', error);
      }
    };
    fetchLogo();
  }, []);

  

  // Load transactions from API
  const fetchTransactions = async () => { // Moved outside useEffect
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`);
      const data = await response.json();
      if (data.message === 'success') {
        const parsedTransactions = data.data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
          items: Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]')
        }));
        setTransactions(parsedTransactions);
      } else {
        console.error('Failed to fetch transactions:', data.error);
        setTransactions([]); // Set to empty array on failure
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]); // Set to empty array on network error
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  

  // Filter transactions based on search, filters, and date range
  const applyFilters = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(transaction => 
        transaction?.items?.some(item => 
          item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
        ) || 
        transaction?.total?.toString()?.includes(searchTerm) ||
        transaction?.id?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      );
    }

    // Type filter
    if (filters?.type !== 'all') {
      filtered = filtered?.filter(transaction => {
        if (filters?.type === 'regular') return !transaction?.isEmployeeMeal;
        if (filters?.type === 'employee') return transaction?.isEmployeeMeal;
        return true;
      });
    }

    // Amount range filter
    if (filters?.amountRange !== 'all') {
      filtered = filtered?.filter(transaction => {
        const amount = transaction?.total;
        switch (filters?.amountRange) {
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

    // Date range filter
    if (dateRange?.startDate || dateRange?.endDate) {
      filtered = filtered?.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : null;

        if (startDate && endDate) {
          return transactionDate >= startDate && transactionDate <= endDate;
        } else if (startDate) {
          return transactionDate >= startDate;
        } else if (endDate) {
          return transactionDate <= endDate;
        }
        return true;
      });
    }

    // Sort by timestamp (newest first)
    filtered?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }, [transactions, searchTerm, filters, dateRange]);

  useEffect(() => {
    setFilteredTransactions(applyFilters);
  }, [applyFilters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalTransactions = filteredTransactions?.length;
    const totalRevenue = filteredTransactions?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);
    const employeeMealCount = filteredTransactions?.filter(t => t?.isEmployeeMeal)?.length;

    return {
      totalTransactions,
      totalRevenue,
      employeeMealCount
    };
  }, [filteredTransactions]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'deleted') {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
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
        setTransactions([]);
      } else {
        console.error('Failed to clear transactions:', data.error);
      }
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  const handleExportTransactions = async (format) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataToExport = prepareTransactionDataForExport(filteredTransactions);

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
        const totalTransactions = filteredTransactions?.length;
        const totalRevenue = filteredTransactions?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);

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

        // Add logo and store name to header
        const imgData = logoBase64; // Use the base64 string
        const imgWidth = 20;
        const imgHeight = 20;
        const imgX = (doc.internal.pageSize.width / 2) - (imgWidth / 2); // Center the image
        if (imgData) {
          doc.addImage(imgData, 'PNG', imgX, 10, imgWidth, imgHeight);
        } else {
          console.warn('Logo not loaded, skipping image in PDF.');
        }

        doc.setFontSize(16);
        doc.text("Kasir Berkah 88", doc.internal.pageSize.width / 2, 35, { align: 'center' });

        // Report Title
        doc.setFontSize(20);
        doc.text("Laporan Penjualan Kasir", doc.internal.pageSize.width / 2, 50, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 14, 60);

        // Prepare table data
        const headers = Object.keys(dataToExport[0] || {});
        const body = dataToExport.map(row => Object.values(row));

        autoTable(doc, {
          startY: 70,
          head: [headers],
          body: body,
          theme: 'grid', // Use 'grid' for borders
          styles: {
            fontSize: 8,
            cellPadding: 2,
            font: 'helvetica', // Ensure Helvetica
            textColor: [0, 0, 0], // Black text
          },
          headStyles: {
            fillColor: [20, 83, 45], // Dark green header
            textColor: 255, // White text
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245], // Light grey for alternate rows
          },
          didDrawPage: function (data) {
            // Footer
            let str = "Halaman " + doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          }
        });

        // Add total transactions below the table
        const finalY = doc.lastAutoTable.finalY; // Get the Y position of the end of the table
        const totalTransactions = filteredTransactions?.length;
        const totalRevenue = filteredTransactions?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);

        doc.setFontSize(12);
        doc.text(`Total Transaksi: ${totalTransactions}`, 14, finalY + 10);
        doc.text(`Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`, 14, finalY + 17);

        doc.save(`riwayat-transaksi-${new Date()?.toISOString()?.split('T')?.[0]}.pdf`);
      }
      
      console.log(`Exported ${filteredTransactions?.length} transactions as ${format}`);
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

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="px-4 lg:px-6 py-6">
          <div className="mb-6">
            <BreadcrumbNavigation customPath={breadcrumbPath} />
            <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary mt-2">
              Riwayat Transaksi
            </h1>
            <p className="text-text-secondary mt-1">
              Kelola dan pantau semua transaksi penjualan Anda
            </p>
          </div>

          <div className="space-y-6" ref={exportContentRef}>
            <TransactionFilters
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onDateRangeChange={handleDateRangeChange}
              totalTransactions={summaryStats?.totalTransactions}
              totalRevenue={summaryStats?.totalRevenue}
              employeeMealCount={summaryStats?.employeeMealCount}
            />

            <TransactionTable
              transactions={filteredTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              isMobile={isMobile}
            />

            <BulkActions
              onClearAllTransactions={handleClearAllTransactions}
              onExportTransactions={handleExportTransactions}
              transactionCount={filteredTransactions?.length}
              isExporting={isExporting}
            />
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default TransactionHistory;