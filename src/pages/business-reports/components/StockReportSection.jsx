import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const StockReportSection = ({ data, onExportStock }) => {
  if (!data) return null;

  const { totalValue, totalItems, lowStockItems, lowStock } = data;

  const stockMetrics = [
    { label: 'Total Nilai Stok', value: formatCurrency(totalValue) },
    { label: 'Jumlah Item', value: totalItems },
    { label: 'Stok Menipis', value: lowStockItems }
  ];

  return (
    <ReportCard
      title="Laporan Stok"
      description="Analisis inventori dan performa produk"
      icon="Package"
      iconColor="text-primary"
      iconBgColor="bg-primary/10"
      metrics={stockMetrics}
      onExport={onExportStock} // This is still a mock function
      exportLabel="Export Stok"
    >
      <div className="space-y-6">
        {/* Low Stock Alert */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="AlertTriangle" size={16} className="text-warning mr-2" />
            Stok Menipis
          </h4>
          <div className="space-y-2">
            {lowStock && lowStock.map((item, index) => (
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
            ))}
            {(!lowStock || lowStock.length === 0) && (
                <p className="text-center py-4 text-text-secondary">Tidak ada item dengan stok menipis.</p>
            )}
          </div>
        </div>
      </div>
    </ReportCard>
  );
};

export default StockReportSection;