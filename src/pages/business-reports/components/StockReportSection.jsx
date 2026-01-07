import React, { useState } from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';
import Pagination from '../../../components/ui/Pagination';
import { exportToExcel, exportToPdf, prepareSoldStockDataForExport } from '../../../utils/exportUtils';
import { formatInTimeZone } from 'date-fns-tz';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const StockReportSection = ({ data, dateRange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!data) return null;

  const { totalValue, totalItems, lowStockItems, items, lowStock, currentStockValue } = data;

  // Pagination logic for lowStock
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLowStockItems = lowStock ? lowStock.slice(indexOfFirstItem, indexOfLastItem) : [];

  const stockMetrics = [
    { label: 'Total Nilai Stok (Saat Ini)', value: formatCurrency(currentStockValue) },
    { label: 'Nilai Item Terjual', value: formatCurrency(totalValue) },
    { label: 'Jumlah Item Terjual', value: totalItems },
    { label: 'Stok Menipis (Saat Ini)', value: lowStockItems }
  ];

  const handleExportPdfStock = () => {
    const formattedStockData = prepareSoldStockDataForExport(items);
    const startDateStr = dateRange ? formatInTimeZone(dateRange.startDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
    const endDateStr = dateRange ? formatInTimeZone(dateRange.endDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
    const filename = `Laporan_Stok_Terjual_${startDateStr}_sd_${endDateStr}`;
    exportToPdf(formattedStockData, filename, dateRange);
  };

  const handleExportExcelStock = () => {
    const formattedStockData = prepareSoldStockDataForExport(items);
    const startDateStr = dateRange ? formatInTimeZone(dateRange.startDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
    const endDateStr = dateRange ? formatInTimeZone(dateRange.endDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
    const filename = `Laporan_Stok_Terjual_${startDateStr}_sd_${endDateStr}`;
    exportToExcel(formattedStockData, filename);
  };

  const exportOptions = [
    { label: 'Export PDF', onClick: handleExportPdfStock },
    { label: 'Export Excel', onClick: handleExportExcelStock },
  ];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <ReportCard
      title="Laporan Stok"
      description="Analisis inventori dan performa produk berdasarkan penjualan"
      icon="Package"
      iconColor="text-primary"
      iconBgColor="bg-primary/10"
      metrics={stockMetrics}
      exportOptions={exportOptions}
    >
      <div className="space-y-6">
        {/* Low Stock Alert */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="AlertTriangle" size={16} className="text-warning mr-2" />
            Stok Menipis (Saat Ini)
          </h4>
          <div className="space-y-2">
            {currentLowStockItems.length > 0 ? (
              currentLowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">
                      Stok: {item.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-text-primary">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="flex items-center text-xs text-warning">
                      <Icon name="TrendingDown" size={12} className="mr-1" />
                      Perlu Restock
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-text-secondary">Tidak ada item dengan stok menipis.</p>
            )}
          </div>

          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={lowStock ? lowStock.length : 0}
            paginate={paginate}
            currentPage={currentPage}
          />
        </div>
      </div>
    </ReportCard>
  );
};

export default StockReportSection;
