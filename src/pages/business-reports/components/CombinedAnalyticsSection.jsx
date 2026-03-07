import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const CombinedAnalyticsSection = ({ reportData, onExportCombined }) => {
  if (!reportData || !reportData.sales || !reportData.expenses || !reportData.stock) return null;

  const { sales, expenses, stock, rawMetrics, balances, allTime } = reportData;
  const { totalRevenue, initialCapital, workingCapital } = sales;
  const totalExpenses = expenses.summary.totalExpenses;
  const netProfit = totalRevenue - totalExpenses;

  // All-time metrics for Audit
  const totalRevenueAllTime = allTime?.totalRevenue || 0;
  const totalExpensesAllTime = allTime?.totalExpenses || 0;
  const netProfitAllTime = totalRevenueAllTime - totalExpensesAllTime;

  // Actual Cash (Saldo Owner + Saldo Lapak)
  const ownerBalance = balances?.ownerBalance || 0;
  const lapakBalance = balances?.lapakBalance || 0;
  const currentEndingCapital = ownerBalance + lapakBalance;

  // Expected Cash (Modal Awal + Pendapatan Periode - Pengeluaran Periode)
  const expectedEndingCapital = (initialCapital || 0) + totalRevenue - totalExpenses;
  const auditDifference = currentEndingCapital - expectedEndingCapital;

  // Modal Berjalan (Formula: Modal awal + total pendapatan periode + total stok - total pengeluaran periode)
  const stockValue = rawMetrics?.totalStockValue || 0;
  const workingModal = (initialCapital || 0) + totalRevenue + stockValue - totalExpenses;

  // Equity
  const equity = (initialCapital || 0) + netProfit;

  const analyticsMetrics = [
    { label: 'Laba Bersih (Periode)', value: formatCurrency(netProfit) },
    { label: 'Selisih Audit (Periode)', value: formatCurrency(auditDifference), color: auditDifference < 0 ? 'text-destructive' : 'text-success' },
    { label: 'Kekayaan Bisnis (Periode)', value: formatCurrency(equity) },
  ];

  const auditCards = [
    {
      title: 'Modal Awal',
      value: formatCurrency(initialCapital || 0),
      desc: 'Jumlah modal awal yang disetor',
      icon: 'PiggyBank',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Modal Berjalan',
      value: formatCurrency(workingModal),
      desc: 'Modal awal + pendapatan + stok - pengeluaran',
      icon: 'Wallet',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Modal Akhir Saat Ini',
      value: formatCurrency(currentEndingCapital),
      desc: 'Saldo owner + saldo lapak',
      icon: 'TrendingUp',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Total Nilai Stok',
      value: formatCurrency(stockValue),
      desc: 'Modal yang berbentuk barang (Bahan & Menu)',
      icon: 'Package',
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10'
    },
    {
      title: 'Saldo Owner',
      value: formatCurrency(ownerBalance),
      desc: 'Dana lapak yang ada di Owner',
      icon: 'Wallet',
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10'
    },
    {
      title: 'Kekayaan Bisnis (Equity)',
      value: formatCurrency(equity),
      desc: 'Modal Awal + Laba Bersih Periode Ini',
      icon: 'ShieldCheck',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Total Pendapatan (Periode Ini)',
      value: formatCurrency(totalRevenue),
      desc: 'Pendapatan yang tercatat pada periode ini',
      icon: 'TrendingUp',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'Total Pengeluaran (Periode Ini)',
      value: formatCurrency(totalExpenses),
      desc: 'Pengeluaran yang tercatat pada periode ini',
      icon: 'TrendingDown',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      title: 'Laba Bersih (Periode Ini)',
      value: formatCurrency(netProfit),
      desc: 'Laba/rugi yang tercatat pada periode ini',
      icon: 'BarChart3',
      color: netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bgColor: netProfit >= 0 ? 'bg-emerald-600/10' : 'bg-rose-600/10'
    },
    {
      title: 'Selisih Perhitungan (Audit)',
      value: `${formatCurrency(auditDifference)} ${auditDifference < 0 ? '(Uang Kurang)' : auditDifference > 0 ? '(Uang Lebih)' : '(Pas)'}`,
      desc: 'Modal Akhir - (Modal Awal + Pendapatan - Pengeluaran)',
      icon: auditDifference === 0 ? 'CheckCircle' : 'AlertCircle',
      color: auditDifference < 0 ? 'text-red-500' : auditDifference > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: auditDifference < 0 ? 'bg-red-500/10' : auditDifference > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      highlight: true
    }
  ];

  return (
    <ReportCard
      title="Audit & Analisis Keuangan"
      description="Pemantauan integritas data finansial dan kesehatan modal bisnis"
      icon="ShieldCheck"
      iconColor="text-primary"
      iconBgColor="bg-primary/10"
      metrics={analyticsMetrics}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {auditCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all hover:shadow-md ${card.highlight ? 'lg:col-span-2 border-current/30 shadow-sm' : 'border-border'
              } ${card.bgColor}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon name={card.icon} size={20} />
              </div>
              {card.highlight && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${card.bgColor} ${card.color} border border-current/20`}>
                  Audit Result
                </span>
              )}
            </div>
            <div>
              <p className={`text-xl font-mono font-bold mb-1 break-words ${card.color}`}>
                {card.value}
              </p>
              <p className="text-sm font-semibold text-text-primary mb-1">
                {card.title}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ReportCard>
  );
};

export default CombinedAnalyticsSection;