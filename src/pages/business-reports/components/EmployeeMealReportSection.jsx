import React, { useState } from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';
import Pagination from '../../../components/ui/Pagination';

// Helper function to format currency
const formatCurrency = (value) => {
  const numericValue = parseFloat(value);
  if (typeof numericValue !== 'number' || isNaN(numericValue)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericValue);
};

const EmployeeMealReportSection = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || !data.summary) return null;

  const { summary, items } = data;

  // Pagination logic for items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items ? items.slice(indexOfFirstItem, indexOfLastItem) : [];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const employeeMealMetrics = [
    { label: 'Total Makanan Karyawan', value: summary.totalMeals },
    { label: 'Total Item Disajikan', value: summary.totalItemsServed },
    { label: 'Estimasi Nilai', value: formatCurrency(summary.estimatedValue) }
  ];

  return (
    <ReportCard
      title="Laporan Makanan Karyawan"
      description="Rincian konsumsi makanan oleh karyawan untuk tujuan pelacakan stok."
      icon="Forklift" // Using Forklift as an icon, or perhaps Utensils/Soup
      iconColor="text-blue-500" // A distinct color
      iconBgColor="bg-blue-500/10"
      metrics={employeeMealMetrics}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="Star" size={16} className="text-accent mr-2" />
            Detail Makanan Karyawan
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-text-secondary font-medium">Tanggal</th>
                  <th className="text-left py-2 text-text-secondary font-medium">Item Menu</th>
                  <th className="text-left py-2 text-text-secondary font-medium">Jumlah</th>
                  <th className="text-right py-2 text-text-secondary font-medium">Nilai Estimasi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 text-text-primary font-mono">{item.date}</td>{/* Date already formatted from parent */}
                      <td className="py-3 text-text-primary font-medium">{item.name}</td>
                      <td className="py-3 text-text-primary">{item.quantity}</td>
                      <td className="py-3 text-right font-mono text-text-primary">{formatCurrency(item.estimatedValue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-text-secondary">
                      Tidak ada data makanan karyawan pada periode ini.
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

export default EmployeeMealReportSection;

