import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const CombinedAnalyticsSection = ({ salesData, stockData, onExportCombined }) => {
  if (!salesData || !stockData) return null;

  const netProfit = salesData.totalRevenue; // No expenses tracked yet
  const profitMargin = salesData.totalRevenue > 0 ? 100 : 0; // Simplified

  const analyticsMetrics = [
    { label: 'Laba Bersih (Revenue)', value: formatCurrency(netProfit) },
    { label: 'Margin Keuntungan', value: `${profitMargin.toFixed(1)}%` },
  ];

  const cashFlowSummary = [
    { type: 'Pemasukan', amount: formatCurrency(salesData.totalRevenue), icon: 'TrendingUp', color: 'text-success', bgColor: 'bg-success/10' },
    { type: 'Pengeluaran', amount: formatCurrency(0), icon: 'TrendingDown', color: 'text-destructive', bgColor: 'bg-destructive/10' },
    { type: 'Laba Bersih', amount: formatCurrency(netProfit), icon: 'DollarSign', color: 'text-primary', bgColor: 'bg-primary/10' }
  ];

  return (
    <ReportCard
      title="Analisis Gabungan"
      description="Ringkasan performa bisnis dan indikator kunci"
      icon="BarChart3"
      iconColor="text-accent"
      iconBgColor="bg-accent/10"
      metrics={analyticsMetrics}
      onExport={onExportCombined} // This is still a mock function
      exportLabel="Export Lengkap"
    >
      <div className="space-y-6">
        {/* Cash Flow Summary */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="Wallet" size={16} className="text-primary mr-2" />
            Ringkasan Arus Kas (Berdasarkan Pemasukan)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cashFlowSummary?.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg ${item?.bgColor} border border-current/20`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon name={item?.icon} size={20} className={item?.color} />
                  <span className={`text-xs font-medium ${item?.color}`}>{item?.type}</span>
                </div>
                <p className={`text-xl font-mono font-semibold ${item?.color}`}>
                  {item?.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
         <div className="text-center py-8">
            <p className="text-text-secondary">Analisis lebih lanjut akan tersedia saat fitur pelacakan pengeluaran ditambahkan.</p>
        </div>
      </div>
    </ReportCard>
  );
};

export default CombinedAnalyticsSection;