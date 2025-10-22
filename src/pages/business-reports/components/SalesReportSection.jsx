import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const SalesReportSection = ({ data, onExportSales }) => {
  if (!data) return null;

  const { totalRevenue, totalTransactions, averageOrder, topItems } = data;

  const salesMetrics = [
    { label: 'Total Penjualan', value: formatCurrency(totalRevenue) },
    { label: 'Transaksi', value: totalTransactions },
    { label: 'Rata-rata Order', value: formatCurrency(averageOrder) }
  ];

  return (
    <ReportCard
      title="Laporan Penjualan"
      description="Analisis pendapatan dan tren penjualan"
      icon="TrendingUp"
      iconColor="text-success"
      iconBgColor="bg-success/10 dark:bg-success/20"
      metrics={salesMetrics}
      onExport={onExportSales} // This is still a mock function
      exportLabel="Export Penjualan"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center dark:text-white">
            <Icon name="Star" size={16} className="text-accent mr-2" />
            Menu Terlaris
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-700">
                  <th className="text-left py-2 text-text-secondary font-medium dark:text-gray-400">Nama Menu</th>
                  <th className="text-right py-2 text-text-secondary font-medium dark:text-gray-400">Terjual</th>
                  <th className="text-right py-2 text-text-secondary font-medium dark:text-gray-400">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {topItems && topItems.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-gray-800">
                    <td className="py-3 text-text-primary font-medium dark:text-white">{item.name}</td>
                    <td className="py-3 text-right font-mono text-text-primary dark:text-white">{item.sold}</td>
                    <td className="py-3 text-right font-mono text-text-primary dark:text-white">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
                 {(!topItems || topItems.length === 0) && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-text-secondary dark:text-gray-400">Tidak ada data penjualan pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportCard>
  );
};

export default SalesReportSection;