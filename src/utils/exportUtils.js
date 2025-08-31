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

export const exportToExcel = (data, filename = 'data') => {
  const totalStock = calculateTotalStock(data);
  const totalPriceOfStock = calculateTotalPriceOfStock(data); // New calculation
  const title = "Laporan Stok Menu";

  // Prepare data for Excel
  const ws_data = [
    [title], // Title row
    [], // Empty row for spacing
    Object.keys(data[0] || {}), // Headers
    ...data.map(item => Object.values(item)), // Data rows
    [], // Empty row before summary
    ['Total Stok:', totalStock], // Summary row for stock
    ['Total Harga Stok:', totalPriceOfStock.toLocaleString('id-ID')] // New summary row for total price
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
  XLSX.utils.book_append_sheet(wb, ws, "Stok Menu");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPdf = (data, filename = 'data') => {
  const doc = new jsPDF();
  const totalStock = calculateTotalStock(data);
  const totalPriceOfStock = calculateTotalPriceOfStock(data); // New calculation

  // Add title
  doc.setFontSize(18);
  doc.text("Laporan Stok Menu", 14, 22);
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

  // Add total stock summary
  let finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Stok: ${totalStock}`, 14, finalY + 10);
  doc.text(`Total Harga Stok: Rp ${totalPriceOfStock.toLocaleString('id-ID')}`, 14, finalY + 17); // New summary line

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