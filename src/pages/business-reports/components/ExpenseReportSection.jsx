import React from 'react';
import ReportCard from './ReportCard';

const ExpenseReportSection = ({ data, onExportExpenses }) => {
  if (!data) return null;

  const { summary } = data;

  const expenseMetrics = [
    { label: 'Total Pengeluaran', value: summary.totalExpenses },
    { label: 'Kategori Aktif', value: summary.categories },
    { label: 'Rata-rata Harian', value: summary.averageDaily }
  ];

  return (
    <ReportCard
      title="Laporan Pengeluaran"
      description="Analisis biaya operasional dan kategori pengeluaran"
      icon="Receipt"
      iconColor="text-destructive"
      iconBgColor="bg-destructive/10"
      metrics={expenseMetrics}
      onExport={onExportExpenses} // This is still a mock function
      exportLabel="Export Pengeluaran"
    >
      <div className="text-center py-8">
        <p className="text-text-secondary">Fitur pelacakan pengeluaran belum tersedia.</p>
        <p className="text-text-secondary">Data akan ditampilkan di sini setelah ditambahkan.</p>
      </div>
    </ReportCard>
  );
};

export default ExpenseReportSection;