import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const CombinedAnalyticsSection = ({ salesData, stockData, expensesData, onExportCombined }) => {
  if (!salesData || !stockData || !expensesData || !expensesData.summary) return null;

  const { totalRevenue, initialCapital } = salesData;
  const totalExpenses = expensesData.summary.totalExpenses; // Get total expenses
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const capitalGrowth = initialCapital > 0 ? (netProfit / initialCapital) * 100 : 0;

  const analyticsMetrics = [
    { label: 'Laba Bersih', value: formatCurrency(netProfit) },
    { label: 'Margin Keuntungan', value: `${profitMargin.toFixed(1)}%` },
    { label: 'Pertumbuhan Modal', value: `${capitalGrowth.toFixed(1)}%` },
  ];

  const cashFlowSummary = [
    { type: 'Modal Awal', amount: formatCurrency(initialCapital || 0), icon: 'Landmark', color: 'text-info', bgColor: 'bg-info/10' },
    { type: 'Pemasukan', amount: formatCurrency(totalRevenue), icon: 'TrendingUp', color: 'text-success', bgColor: 'bg-success/10' },
    { type: 'Pengeluaran', amount: formatCurrency(totalExpenses), icon: 'TrendingDown', color: 'text-destructive', bgColor: 'bg-destructive/10' }, // Use totalExpenses
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
    >
      <div className="space-y-6">
        {/* Cash Flow Summary */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <Icon name="Wallet" size={16} className="text-primary mr-2" />
            Ringkasan Arus Kas (Berdasarkan Pemasukan)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>
    </ReportCard>
  );
};

export default CombinedAnalyticsSection;