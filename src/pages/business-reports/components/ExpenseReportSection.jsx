import React, { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';
import Pagination from '../../../components/ui/Pagination';

// Helper function to format currency
const formatCurrency = (value) => {
  const numericValue = parseFloat(value); // Parse the value first
  if (typeof numericValue !== 'number' || isNaN(numericValue)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericValue);
};

const ExpenseReportSection = ({ data, onExportExpenses }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || !data.summary) return null;

  const { summary, items } = data;

  // Pagination logic for items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items ? items.slice(indexOfFirstItem, indexOfLastItem) : [];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const expenseMetrics = [
    { label: 'Total Pengeluaran', value: formatCurrency(summary.totalExpenses) },
    { label: 'Kategori Aktif', value: summary.categories },
    { label: 'Rata-rata Harian', value: formatCurrency(summary.averageDaily) }
  ];

  return (
    <ReportCard
      title="Laporan Pengeluaran"
      description="Analisis biaya operasional dan kategori pengeluaran"
      icon="Receipt"
      iconColor="text-destructive"
      iconBgColor="bg-destructive/10"
      metrics={expenseMetrics}
      onExport={onExportExpenses}
      exportLabel="Export Pengeluaran"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="List" size={16} className="text-accent mr-2" />
            Detail Pengeluaran
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-text-secondary font-medium">Tanggal</th>
                  <th className="text-left py-2 text-text-secondary font-medium">Deskripsi</th>
                  <th className="text-left py-2 text-text-secondary font-medium">Kategori</th>
                  <th className="text-right py-2 text-text-secondary font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 text-text-primary font-mono">{formatInTimeZone(new Date(item.date), 'Asia/Jakarta', 'dd/MM/yyyy')}</td>
                      <td className="py-3 text-text-primary font-medium">{item.name}</td>
                      <td className="py-3 text-text-primary">{item.category}</td>
                      <td className="py-3 text-right font-mono text-text-primary">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-text-secondary">
                      Tidak ada data pengeluaran pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={items ? items.length : 0}
            paginate={paginate}
            currentPage={currentPage}
          />
        </div>
      </div>
    </ReportCard>
  );
};

export default ExpenseReportSection;
