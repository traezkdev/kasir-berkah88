import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to calculate total stock (original, for actual stock data)
const calculateTotalStock = (data) => {
  return data.reduce((sum, item) => sum + (item.stock || 0), 0);
};

// Helper function to calculate total stock price (original, for actual stock data)
const calculateTotalPriceOfStock = (data) => {
  return data.reduce((sum, item) => sum + ((item.stock || 0) * (item.price || 0)), 0);
};

// Helper function to calculate total raw material value
const calculateTotalRawMaterialValue = (data) => {
  // Parsing currency string back to number for calculation if needed, but here we expect pre-calculated values or raw numbers
  // However, looking at the plan and data, we will likely pass formatted strings or raw numbers.
  // Let's assume we pass raw numbers in a specific way or just sum the raw data before formatting if possible.
  // Actually, for the summary in `exportToExcel` and `exportToPdf`, we iterate over `data`.
  // If `data` contains formatted strings, we can't easily sum them.
  // Strategy: The component should calculate the totals and pass them, OR we calculate here if data allows.
  // But standard pattern here is calculating from `data` array which is ready for export (keys are Indonesian headers).
  // Let's look at `prepareRawMaterialStockDataForExport`. It maps to headers.
  // So 'Total Stok' in the row might be a number or string.
  // use `prepareRawMaterialStockDataForExport` sets 'Total Stok' as number.
  return data.reduce((sum, item) => sum + (item['Total Nilai'] || 0), 0);
};

const calculateTotalRawMaterialStock = (data) => {
  return data.reduce((sum, item) => sum + (item['Total Stok'] || 0), 0);
}

// New helper function to calculate total sold items from prepared data
const calculateTotalSoldItems = (data) => {
  return data.reduce((sum, item) => sum + (item['Terjual'] || 0), 0);
};

// New helper function to calculate total revenue from prepared sold items data
const calculateTotalRevenueFromSoldItems = (data) => {
  return data.reduce((sum, item) => sum + (item['Pendapatan'] || 0), 0);
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

  // Original logic for single-type data (menu items, expenses, or sold items)
  const isExpenseData = filename.includes('Pengeluaran'); // Simple check
  const isSoldStockData = filename.includes('Stok_Terjual'); // Check for sold stock data
  const isTopSellingData = filename.includes('Menu_Terlaris'); // New check for top selling items data
  const isRawMaterialStockData = filename.includes('Stok_Bahan_Mentah'); // Check for raw material stock data

  let title;
  let summaryRows = [];

  if (isExpenseData) {
    title = "Laporan Pengeluaran";
    const totalAmount = calculateTotalAmount(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Pengeluaran:', totalAmount.toLocaleString('id-ID')]
    ];
  } else if (isSoldStockData) {
    title = "Laporan Stok Menu Terjual";
    const totalSoldItems = calculateTotalSoldItems(data);
    const totalRevenueFromSoldItems = calculateTotalRevenueFromSoldItems(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Item Terjual:', totalSoldItems],
      ['Total Pendapatan:', formatCurrency(totalRevenueFromSoldItems)]
    ];
  } else if (isTopSellingData) { // Handle top selling items data summary
    title = "Laporan Menu Terlaris";
    const totalSoldItems = data.reduce((sum, item) => sum + (item['Terjual'] || 0), 0);
    const totalRevenueFromSoldItems = data.reduce((sum, item) => sum + (item['Pendapatan'] || 0), 0);
    summaryRows = [
      [], // Empty row before summary
      ['Total Item Terjual:', totalSoldItems.toString()],
      ['Total Pendapatan:', formatCurrency(totalRevenueFromSoldItems)]
    ];
  } else if (isRawMaterialStockData) {
    title = "Laporan Stok Bahan Mentah";
    const totalStock = calculateTotalRawMaterialStock(data);
    const totalValue = calculateTotalRawMaterialValue(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Quantity Stok:', totalStock],
      ['Total Nilai Stok:', formatCurrency(totalValue)]
    ];
  } else {
    title = "Laporan Stok Menu"; // Default title for original stock data
    const totalStock = calculateTotalStock(data);
    const totalPriceOfStock = calculateTotalPriceOfStock(data);
    summaryRows = [
      [], // Empty row before summary
      ['Total Stok:', totalStock],
      ['Total Harga Stok:', formatCurrency(totalPriceOfStock)]
    ];
  }

  // Prepare data for Excel
  const ws_data = [
    [title],
    [],
    Object.keys(data[0] || {}),
    ...data.map(item => Object.values(item)),
    ...summaryRows
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
  const headerRowIndex = 2;
  const max_width = ws_data[headerRowIndex].map((header, i) => Math.max(...ws_data.map(row => (row[i] ? row[i].toString().length : 0)), header.length));
  ws['!cols'] = max_width.map(w => ({ wch: w + 2 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isExpenseData ? "Pengeluaran" : (isSoldStockData ? "Stok Terjual" : (isTopSellingData ? "Menu Terlaris" : (isRawMaterialStockData ? "Stok Bahan Mentah" : "Stok Menu"))));
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

    let finalY = 40;
    data.forEach(section => {
      // Calculate required space for title (~15mm) + at least one table row (~7mm) + margin (~20mm)
      const requiredSpace = 15 + 7 + 20;
      const remainingPageSpace = doc.internal.pageSize.height - finalY;

      // If not enough space for title and first row, add a new page
      // Also, ensure it's not the very first section on the very first page
      if (finalY > 40 && remainingPageSpace < requiredSpace) {
        doc.addPage();
        finalY = 20;
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
        margin: { bottom: 20 },
        didDrawPage: function (data) {
          // Footer
          let str = "Halaman " + doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      finalY = doc.lastAutoTable.finalY;
      finalY += 10;
    });

    doc.save(`${filename}.pdf`);
    return;
  }

  const isExpenseData = filename.includes('Pengeluaran'); // Simple check
  const isTopSellingData = filename.includes('Menu_Terlaris'); // New check for top selling items data
  const isRawMaterialStockData = filename.includes('Stok_Bahan_Mentah'); // Check for raw material stock data

  let title = "Laporan Stok Menu";
  let summaryLines = [];

  if (isExpenseData) {
    title = "Laporan Pengeluaran";
    const totalAmount = calculateTotalAmount(data);
    summaryLines = [
      `Total Pengeluaran: ${formatCurrency(totalAmount)}`
    ];
  } else if (isTopSellingData) {
    title = "Laporan Menu Terlaris";
    const totalSoldItems = data.reduce((sum, item) => sum + (item['Terjual'] || 0), 0);
    const totalRevenueFromSoldItems = data.reduce((sum, item) => sum + (item['Pendapatan'] || 0), 0);
    summaryLines = [
      `Total Item Terjual: ${totalSoldItems}`,
      `Total Pendapatan: ${formatCurrency(totalRevenueFromSoldItems)}`
    ];
  } else if (isRawMaterialStockData) {
    title = "Laporan Stok Bahan Mentah";
    const totalStock = calculateTotalRawMaterialStock(data);
    const totalValue = calculateTotalRawMaterialValue(data);
    summaryLines = [
      `Total Quantity Stok: ${totalStock}`,
      `Total Nilai Stok: ${formatCurrency(totalValue)}`
    ];
  } else {
    const totalStock = calculateTotalStock(data);
    const totalPriceOfStock = calculateTotalPriceOfStock(data);
    summaryLines = [
      `Total Stok: ${totalStock}`,
      `Total Harga Stok: ${formatCurrency(totalPriceOfStock)}`
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
    'Kasir': transaction.cashier_name || 'System',
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
    'Dicatat Oleh': expense.recorded_by || 'System',
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

export const prepareTopSellingItemsForExport = (topItems) => {
  return topItems.map(item => ({
    'Nama Menu': item.name,
    'Terjual': item.sold,
    'Pendapatan': parseFloat(item.revenue || 0),
  }));
};

export const prepareSoldStockDataForExport = (soldItems) => {
  return soldItems.map(item => ({
    'Nama Menu': item.name,
    'Terjual': item.sold,
    'Pendapatan': parseFloat(item.revenue || 0),
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
      ['Modal Awal', formatCurrency(sales.initialCapital || 0)],
      ['Modal Berjalan', formatCurrency(sales.workingCapital || 0)],
      ['Laba Bersih (Periode Ini)', formatCurrency(netProfit || 0)],
      ['Pertumbuhan Modal (dari Laba Bersih)', `${capitalGrowth.toFixed(1)}%`]
    ],
  });

  // Sales Summary
  sections.push({
    title: 'Ringkasan Penjualan',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Pendapatan', formatCurrency(sales.totalRevenue)],
      ['Total Transaksi', sales.totalTransactions.toString()],
      ['Rata-rata Order', formatCurrency(sales.averageOrder)],
    ],
  });

  // Top Selling Items
  sections.push({
    title: 'Menu Terlaris',
    headers: ['Nama Menu', 'Terjual', 'Pendapatan'],
    rows: sales.topItems.map(item => [item.name, item.sold.toString(), formatCurrency(item.revenue)]),
  });

  // Expense Summary
  sections.push({
    title: 'Ringkasan Pengeluaran',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Pengeluaran', formatCurrency(expenses.summary.totalExpenses)],
      ['Kategori Aktif', expenses.summary.categories.toString()],
      ['Rata-rata Harian', formatCurrency(expenses.summary.averageDaily)],
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
      formatCurrency(item.amount),
    ]),
  });

  // Stock Summary
  sections.push({
    title: 'Ringkasan Stok',
    headers: ['Keterangan', 'Nilai'],
    rows: [
      ['Total Nilai Stok', formatCurrency(stock.totalValue)],
      ['Jumlah Item', stock.totalItems.toString()],
      ['Stok Menipis', stock.lowStockItems.toString()],
    ],
  });

  // Low Stock Items
  sections.push({
    title: 'Item Stok Menipis',
    headers: ['Nama Menu', 'Stok', 'Harga'],
    rows: stock.lowStock.map(item => [item.name, item.stock.toString(), formatCurrency(item.price)]),
  });

  return sections;
};

export const prepareRawMaterialStockDataForExport = (materials, units = []) => {
  return materials.map(material => {
    const currentStock = Number(material.current_stock) || 0;
    const menuStock = Number(material.menu_stock) || 0;
    const pricePerItem = Number(material.price_per_item) || 0;
    const rawStockPrice = Number(material.raw_stock_price) || 0;
    const totalStock = currentStock + menuStock;

    // Determine if unit is calculable
    const unitData = units.find(u => u.name.toLowerCase() === (material.unit || '').toLowerCase());
    const isCalculable = unitData ? unitData.is_calculable : true; // Default to true if not found

    let menuValue, rawValue, totalValue;
    if (isCalculable) {
      menuValue = menuStock * pricePerItem;
      rawValue = currentStock * rawStockPrice;
      totalValue = menuValue + rawValue;
    } else {
      // For non-calculable units, use prices directly
      menuValue = pricePerItem;
      rawValue = rawStockPrice;
      totalValue = pricePerItem + rawStockPrice;
    }

    return {
      'Nama Bahan': material.name,
      'Stok Mentah': currentStock,
      'Stok Menu': menuStock,
      'Total Stok': totalStock,
      'Satuan': material.unit,
      'Stok Min': Number(material.stok_minimum) || 0,
      'Harga Stok Menu': isCalculable ? pricePerItem : `${pricePerItem} (Nilai Langsung)`,
      'Harga Stok Mentah': isCalculable ? rawStockPrice : `${rawStockPrice} (Nilai Langsung)`,
      'Total Nilai': totalValue, // Keep as number for calculation
      'Status': totalStock < (Number(material.stok_minimum) || 0) ? 'Menipis' : 'Cukup'
    };
  });
};