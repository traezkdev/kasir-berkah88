import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrencyPDF = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

const formatDatePDF = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

/**
 * Generate dan download laporan PDF dari data transaksi.
 * @param {Array} transactions - Array of transaction objects
 */
export const downloadTransaksiPDF = (transactions) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Header ──
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('trzfinance', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo-200
  doc.text('Laporan Riwayat Transaksi', 14, 19);
  doc.text(`Dicetak: ${today}`, pageWidth - 14, 19, { align: 'right' });

  // ── Summary Stats ──
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalIncome - totalExpense;

  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.roundedRect(14, 34, 55, 20, 4, 4, 'F');
  doc.roundedRect(75, 34, 55, 20, 4, 4, 'F');
  doc.roundedRect(136, 34, 60, 20, 4, 4, 'F');

  // Pemasukan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN', 17, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74); // Green-600
  doc.text(formatCurrencyPDF(totalIncome), 17, 49);

  // Pengeluaran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN', 78, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38); // Red-600
  doc.text(formatCurrencyPDF(totalExpense), 78, 49);

  // Saldo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO BERSIH', 139, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(balance >= 0 ? 22 : 220, balance >= 0 ? 163 : 38, balance >= 0 ? 74 : 38);
  doc.text(formatCurrencyPDF(balance), 139, 49);

  // ── Table ──
  const rows = transactions.map((tx, i) => [
    i + 1,
    formatDatePDF(tx.date),
    tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    tx.category,
    tx.note || '-',
    (tx.type === 'income' ? '+' : '-') + formatCurrencyPDF(tx.amount),
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Nominal']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
    },
    alternateRowStyles: {
      fillColor: [238, 242, 255],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 25 },
      3: { cellWidth: 28 },
      4: { cellWidth: 40 },
      5: { cellWidth: 35, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        data.cell.styles.textColor = val.startsWith('+') ? [22, 163, 74] : [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw;
        data.cell.styles.textColor = val === 'Pemasukan' ? [22, 163, 74] : [220, 38, 38];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `trzfinance — Laporan Keuangan Pribadi  |  Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const filename = `trzfinance_transaksi_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
