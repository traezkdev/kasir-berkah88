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

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export const exportToExcel = (data, filename = 'data') => {
  // Check if it's combined data based on the presence of 'title', 'headers', and 'rows' keys
  const isCombinedData = data.length > 0 && data[0].hasOwnProperty('title') && data[0].hasOwnProperty('headers') && data[0].hasOwnProperty('rows');

  if (isCombinedData) {
    const ws = XLSX.utils.json_to_sheet([]);
    let rowIdx = 1;

    // Calculate max columns needed for merging
    let maxCols = 0;
    data.forEach(section => {
      if (section.headers && section.headers.length > maxCols) {
        maxCols = section.headers.length;
      }
    });
    // Ensure a minimum of 2 columns for summary sections if no headers are found or are too small
    if (maxCols < 2) maxCols = 2; 

    // Main Report Title
    XLSX.utils.sheet_add_aoa(ws, [["Laporan Bisnis Gabungan"]], { origin: `A${rowIdx}` });
    if (ws[`A${rowIdx}`]) {
      ws[`A${rowIdx}`].s = { font: { bold: true, sz: 18 }, alignment: { horizontal: "center" } };
    }
    // Merge main title
    if (maxCols > 1) {
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: rowIdx - 1, c: 0 }, e: { r: rowIdx - 1, c: maxCols - 1 } });
    }
    rowIdx++;

    // Export Date
    XLSX.utils.sheet_add_aoa(ws, [[`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}`]], { origin: `A${rowIdx}` });
    if (ws[`A${rowIdx}`]) {
      ws[`A${rowIdx}`].s = { font: { sz: 11 }, alignment: { horizontal: "center" } };
    }
    // Merge date
    if (maxCols > 1) {
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: rowIdx - 1, c: 0 }, e: { r: rowIdx - 1, c: maxCols - 1 } });
    }
    rowIdx += 2; // Add spacing after main title and date

    data.forEach(section => {
      // Section Title
      XLSX.utils.sheet_add_aoa(ws, [[section.title]], { origin: `A${rowIdx}` });
      if (ws[`A${rowIdx}`]) {
        ws[`A${rowIdx}`].s = { font: { bold: true, sz: 14 } };
      }
      // Merge section title
      if (maxCols > 1) {
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: rowIdx - 1, c: 0 }, e: { r: rowIdx - 1, c: maxCols - 1 } });
      }
      rowIdx++;

      // Section Headers
      XLSX.utils.sheet_add_aoa(ws, [section.headers], { origin: `A${rowIdx}` });
      section.headers.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx - 1, c: colIdx });
        if (ws[cellRef]) {
          ws[cellRef].s = { font: { bold: true } };
        }
      });
      rowIdx++;

      // Section Rows
      XLSX.utils.sheet_add_aoa(ws, section.rows, { origin: `A${rowIdx}` });
      rowIdx += section.rows.length;
      rowIdx++; // Add spacing between sections
    });

    // Auto-width columns
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!cols'] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let max_width = 10; // default width
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          max_width = Math.max(max_width, cell.v.toString().length + 2); // +2 for padding
        }
      }
      ws['!cols'][C] = { wch: max_width };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Gabungan");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return;
  }

  // Original logic for single-type data (menu items, expenses)
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
  const isCombinedData = data.length > 0 && data[0].hasOwnProperty('title') && data[0].hasOwnProperty('headers') && data[0].hasOwnProperty('rows');

  if (isCombinedData) {
    // Common PDF header
    doc.setFontSize(18);
    doc.text("Laporan Bisnis Gabungan", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}`, 14, 30);

    let finalY = 40; // Starting Y position for the first table
    data.forEach(section => {
      // Calculate required space for title (~15mm) + at least one table row (~7mm) + margin (~20mm)
      const requiredSpace = 15 + 7 + 20; 
      const remainingPageSpace = doc.internal.pageSize.height - finalY; 

      // If not enough space for title and first row, add a new page
      // Also, ensure it's not the very first section on the very first page
      if (finalY > 40 && remainingPageSpace < requiredSpace) { 
        doc.addPage();
        finalY = 20; // Reset Y position for new page, leaving space for header
      }

      // Add section title
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(section.title, 14, finalY + 10);
      finalY += 15;

      autoTable(doc, {
        startY: finalY,
        head: [section.headers],
        body: section.rows,
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
        margin: { bottom: 20 }, // Add bottom margin to prevent overlap with footer
        didDrawPage: function (data) {
          // Footer
          let str = "Halaman " + doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      finalY = doc.lastAutoTable.finalY; // Update Y position for the next table
      finalY += 10; // Add some space between tables
    });

    doc.save(`${filename}.pdf`);
    return;
  }

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
  let finalY = 30; // Give more space from top
  doc.setFontSize(18);
  doc.text(title, 14, finalY);
  finalY += 10;

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}`, 14, finalY);
  finalY += 10;


  // Prepare table data
  const headers = Object.keys(data[0] || {});
  const body = data.map(item => Object.values(item));

  autoTable(doc, {
    startY: finalY, // Start table after title and date
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
    margin: { bottom: 20 }, // Add bottom margin to prevent overlap with footer
    didDrawPage: function (data) {
      // Footer
      let str = "Halaman " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  // Add dynamic summary lines
  finalY = doc.lastAutoTable.finalY;
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
    'Tanggal': new Date(transaction.timestamp).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
    'Waktu': new Date(transaction.timestamp).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
    'Total': `Rp ${parseFloat(transaction.total || 0).toLocaleString('id-ID')}`,
    'Tipe': transaction.isEmployeeMeal ? 'Karyawan' : transaction.payment_method,
    'Item Terjual': transaction.items.map(item => `${item.name} (${item.quantity})`).join(', '),
  }));
};

export const prepareExpenseDataForExport = (expenses) => {
  return expenses.map(expense => ({
    'ID Pengeluaran': expense.id,
    'Tanggal': new Date(expense.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
    'Waktu': new Date(expense.date).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
    'Kategori': expense.category,
    'Deskripsi': expense.name,
    'Jumlah': parseFloat(expense.amount || 0), // Keep as number for Excel sum
    'Catatan': expense.notes || '',
  }));
};

export const prepareStockDataForExport = (menuItems) => {
  return menuItems.map(item => ({
    'ID Menu': item.id,
    'Nama Menu': item.name,
    'Kategori': item.category,
    'Harga': parseFloat(item.price || 0),
    'Stok': parseInt(item.stock || 0, 10),
  }));
};

export const prepareCombinedDataForExport = (reportData) => {
  const { sales, expenses, stock } = reportData;
  const sections = [];

  // --- NEW: Combined Analytics Section ---
  const netProfit = sales.totalRevenue - expenses.summary.totalExpenses;
  const capitalGrowth = sales.initialCapital > 0 ? (netProfit / sales.initialCapital) * 100 : 0;

  sections.push({
    title: 'Analisis Gabungan',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Modal Awal', `Rp ${parseFloat(sales.initialCapital || 0).toLocaleString('id-ID')}`],
      ['Modal Berjalan', `Rp ${parseFloat(sales.workingCapital || 0).toLocaleString('id-ID')}`],
      ['Laba Bersih (Periode Ini)', `Rp ${parseFloat(netProfit || 0).toLocaleString('id-ID')}`],
      ['Pertumbuhan Modal (dari Laba Bersih)', `${capitalGrowth.toFixed(1)}%`]
    ],
  });

  // Sales Summary
  sections.push({
    title: 'Ringkasan Penjualan',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Pendapatan', formatCurrency(sales.totalRevenue)],
      ['Total Transaksi', sales.totalTransactions],
      ['Rata-rata Order', formatCurrency(sales.averageOrder)],
    ],
  });

  // Top Selling Items
  sections.push({
    title: 'Menu Terlaris',
    headers: ['Nama Menu', 'Terjual', 'Pendapatan'],
    rows: sales.topItems.map(item => [item.name, item.sold, item.revenue]),
  });

  // Expense Summary
  sections.push({
    title: 'Ringkasan Pengeluaran',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Pengeluaran', expenses.summary.totalExpenses],
      ['Kategori Aktif', expenses.summary.categories],
      ['Rata-rata Harian', expenses.summary.averageDaily],
    ],
  });

  // Expense Details
  sections.push({
    title: 'Detail Pengeluaran',
    headers: ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah'],
    rows: expenses.items.map(item => [
      new Date(item.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
      item.name,
      item.category,
      item.amount,
    ]),
  });

  // Stock Summary
  sections.push({
    title: 'Ringkasan Stok',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Nilai Stok', stock.totalValue],
      ['Jumlah Item', stock.totalItems],
      ['Stok Menipis', stock.lowStockItems],
    ],
  });

  // Low Stock Items
  sections.push({
    title: 'Item Stok Menipis',
    headers: ['Nama Menu', 'Stok', 'Harga'],
    rows: stock.lowStock.map(item => [item.name, item.stock, item.price]),
  });

  return sections;
};