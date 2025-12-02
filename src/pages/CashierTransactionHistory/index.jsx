import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FiArrowLeft } from 'react-icons/fi';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { jwtDecode } from 'jwt-decode';
import Icon from '../../components/AppIcon'; // Import Icon for the delete confirmation modal
import Button from '../../components/ui/Button'; // Import Button for the delete confirmation modal


import TransactionFilters from '../transaction-history/components/TransactionFilters';
import TransactionTable from '../transaction-history/components/TransactionTable';
import BulkActions from '../transaction-history/components/BulkActions';
import Pagination from '../../components/ui/Pagination';
import TransactionReceiptModal from '../transaction-history/components/TransactionReceiptModal'; // Import the modal
import EditTransactionModal from '../transaction-history/components/EditTransactionModal'; // Import the new edit modal


import authFetch from '../../utils/authFetch';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { prepareTransactionDataForExport } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';



const apiUrl = import.meta.env.VITE_API_URL;

const CashierTransactionHistory = ({ headerTitle }) => {
  const exportContentRef = useRef(null); // Add this line
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
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
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [chartFilterType, setChartFilterType] = useState('daily'); // New state for chart filter
  const [currentDailyDate, setCurrentDailyDate] = useState(new Date()); // State for current date in daily view

    // State for delete confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [transactionToDeleteId, setTransactionToDeleteId] = useState(null);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
    console.log("Transaction to edit:", transaction); // Debug log
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleUpdateTransaction = async (id, updatedData) => { // Corrected parameters
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${id}`, { // Use the correct id
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData), // Use the correct updatedData
      });
      const data = await response.json();
      if (data.message === 'success') {
        fetchTransactions(); // Refresh the list
        handleCloseEditModal();
      } else {
        console.error('Failed to update transaction:', data.error);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };


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

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in CashierTransactionHistory:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
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

    // Payment method filter
    if (filters?.paymentMethod !== 'all') {
      filtered = filtered?.filter(transaction => transaction.payment_method === filters.paymentMethod);
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

        // Normalize transactionDate to start of day for comparison
        transactionDate.setHours(0, 0, 0, 0);

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

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
    const totalRevenue = filteredTransactions?.filter(t => t.payment_method !== 'Makan Karyawan')?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);
    const employeeMealCount = filteredTransactions?.filter(t => t.payment_method === 'Makan Karyawan')?.length;

    return {
      totalTransactions,
      totalRevenue,
      employeeMealCount
    };
  }, [filteredTransactions]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    return filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredTransactions, indexOfFirstItem, indexOfLastItem]);

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
    setCurrentDailyDate(prevDate => {
      const nextDate = new Date(prevDate);
      nextDate.setDate(prevDate.getDate() + 7);
      return nextDate;
    });
  };

  const handlePrevDayRange = () => {
    setCurrentDailyDate(prevDate => {
      const prevDateClone = new Date(prevDate);
      prevDateClone.setDate(prevDate.getDate() - 7);
      return prevDateClone;
    });
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
        fetchTransactions(); // Refetch all transactions after delete
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

      const totalRevenue = filteredTransactions?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + parseFloat(t?.total || 0), 0);

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
        ];
        const body = dataToExport.map(row => [
          row['ID Transaksi'],
          row['Tanggal'],
          row['Waktu'],
          row['Total'],
          row['Tipe'],
          row['Item Terjual'],
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
      
      console.log(`Exported ${filteredTransactions?.length} transactions as ${format}`);
    } catch (error) {

      console.error('Export failed:', error);

    } finally {

      setIsExporting(false);

    }

  };



  const breadcrumbPath = [

    { label: 'Dashboard Kasir', path: '/cashier-dashboard', isActive: false },

    { label: 'Riwayat Transaksi', path: '/cashier-transaction-history', isActive: true }

  ];



  return (

    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold md:text-2xl">Riwayat Transaksi Kasir</h1>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 md:px-4 md:py-2 rounded-full md:rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
            onClick={() => navigate('/cashier-dashboard')}
            title="Kembali ke Dashboard Kasir"
          >
            <FiArrowLeft className="h-6 w-6 md:hidden" />
            <span className="hidden md:block">Kembali ke Dashboard</span>
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="pb-20 lg:pb-8">

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">





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







                          transactions={currentItems}







                          onEditTransaction={handleEditTransaction}







                          onRowClick={handleTransactionClick}







                          isMobile={isMobile}







                          userRole={userRole}







                          onOpenDeleteConfirm={handleOpenDeleteConfirm} // Pass the new handler







                        />

            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={filteredTransactions.length}
              paginate={paginate}
              currentPage={currentPage}
            />

          </div>

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



// Force re-processing by build system
export default CashierTransactionHistory;
