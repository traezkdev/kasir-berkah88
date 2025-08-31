import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to calculate total stock
const calculateTotalStock = (data) => {
  return data.reduce((sum, item) => sum + (item.stock || 0), 0);
};

// New helper function to calculate total stock price
const calculateTotalPriceOfStock = (data) => {
  return data.reduce((sum, item) => sum + ((item.stock || 0) * (item.price || 0)), 0);
};

// New helper function to calculate total amount (for expenses)
const calculateTotalAmount = (data) => {
  return data.reduce((sum, item) => sum + (item.Jumlah || 0), 0);
};

export const exportToExcel = (data, filename = 'data') => {
  const isExpenseData = filename.includes('Pengeluaran'); // Simple check

  let title = "Laporan Stok Menu";
  let summaryRows = [];

  if (isExpenseData) {
    title = "Laporan Pengeluaran";
    const totalAmount = calculateTotalAmount(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Pengeluaran:', totalAmount.toLocaleString('id-ID')] // Summary row for total amount
    ];
  } else {
    const totalStock = calculateTotalStock(data);
    const totalPriceOfStock = calculateTotalPriceOfStock(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Stok:', totalStock],
      ['Total Harga Stok:', totalPriceOfStock.toLocaleString('id-ID')]
    ];
  }

  // Prepare data for Excel
  const ws_data = [
    [title], // Title row
    [], // Empty row for spacing
    Object.keys(data[0] || {}), // Headers
    ...data.map(item => Object.values(item)), // Data rows
    ...summaryRows // Add dynamic summary rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Merge title cells
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Object.keys(data[0] || {}).length - 1 } }];

  // Basic styling for title (bold, center)
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Auto-width columns
  const headerRowIndex = 2; // Headers are on the 3rd row (index 2)
  const max_width = ws_data[headerRowIndex].map((header, i) => Math.max(...ws_data.map(row => (row[i] ? row[i].toString().length : 0)), header.length));
  ws['!cols'] = max_width.map(w => ({ wch: w + 2 })); // Add some padding

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isExpenseData ? "Pengeluaran" : "Stok Menu");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPdf = (data, filename = 'data') => {
  const doc = new jsPDF();
  const isExpenseData = filename.includes('Pengeluaran'); // Simple check

  let title = "Laporan Stok Menu";
  let summaryLines = [];

  if (isExpenseData) {
    title = "Laporan Pengeluaran";
    const totalAmount = calculateTotalAmount(data);
    summaryLines = [
      `Total Pengeluaran: Rp ${totalAmount.toLocaleString('id-ID')}`
    ];
  } else {
    const totalStock = calculateTotalStock(data);
    const totalPriceOfStock = calculateTotalPriceOfStock(data);
    summaryLines = [
      `Total Stok: ${totalStock}`,
      `Total Harga Stok: Rp ${totalPriceOfStock.toLocaleString('id-ID')}`
    ];
  }

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Tanggal Export: ${new Date().toLocaleDateString()}`, 14, 30);

  // Prepare table data
  const headers = Object.keys(data[0] || {});
  const body = data.map(item => Object.values(item));

  autoTable(doc, {
    startY: 40, // Start table after title and date
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

  // Add dynamic summary lines
  let finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setTextColor(0);
  summaryLines.forEach((line, index) => {
    doc.text(line, 14, finalY + 10 + (index * 7)); // 7 is approximate line height
  });

  doc.save(`${filename}.pdf`);
};

export const prepareTransactionDataForExport = (transactions) => {
  return transactions.map(transaction => ({
    'ID Transaksi': transaction.id,
    'Tanggal': new Date(transaction.timestamp).toLocaleDateString('id-ID'),
    'Waktu': new Date(transaction.timestamp).toLocaleTimeString('id-ID'),
    'Total': `Rp ${parseFloat(transaction.total || 0).toLocaleString('id-ID')}`,
    'Tipe': transaction.isEmployeeMeal ? 'Karyawan' : 'Reguler',
    'Metode Pembayaran': transaction.paymentMethod,
    'Item Terjual': transaction.items.map(item => `${item.name} (${item.quantity})`).join(', '),
  }));
};

export const prepareExpenseDataForExport = (expenses) => {
  return expenses.map(expense => ({
    'ID Pengeluaran': expense.id,
    'Tanggal': new Date(expense.date).toLocaleDateString('id-ID'),
    'Waktu': new Date(expense.date).toLocaleTimeString('id-ID'),
    'Kategori': expense.category,
    'Deskripsi': expense.name,
    'Jumlah': parseFloat(expense.amount || 0), // Keep as number for Excel sum
    'Catatan': expense.notes || '',
  }));
};