import React from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const CombinedAnalyticsSection = ({ reportData, onExportCombined }) => {
  if (!reportData || !reportData.sales || !reportData.expenses || !reportData.stock) return null;

  const { sales, expenses, rawMetrics, balances } = reportData;
  const { totalRevenue, initialCapital } = sales;
  const totalExpenses = expenses.summary.totalExpenses;
  const netProfit = totalRevenue - totalExpenses;

  // Kas aktual (Saldo Owner + Saldo Lapak)
  const ownerBalance = balances?.ownerBalance || 0;
  const lapakBalance = balances?.lapakBalance || 0;
  const currentEndingCapital = ownerBalance + lapakBalance;

  // Kas yang seharusnya ada (Modal Awal + Pendapatan Periode - Pengeluaran Periode)
  const expectedEndingCapital = (initialCapital || 0) + totalRevenue - totalExpenses;
  const auditDifference = currentEndingCapital - expectedEndingCapital;

  // Nilai stok barang
  const stockValue = rawMetrics?.totalStockValue || 0;

  // Summary metrics di header kartu
  const analyticsMetrics = [
    { label: 'Pendapatan', value: formatCurrency(totalRevenue) },
    { label: 'Pengeluaran', value: formatCurrency(totalExpenses) },
    { label: 'Laba Bersih', value: formatCurrency(netProfit) },
  ];

  // Pertumbuhan kas: bandingkan kas aktual vs modal awal
  const capitalGrowth = currentEndingCapital - (initialCapital || 0);
  const capitalGrowthPercent = initialCapital > 0
    ? ((capitalGrowth / initialCapital) * 100).toFixed(1)
    : 0;

  // 7 kartu inti yang paling penting
  const auditCards = [
    {
      title: 'Modal Awal',
      value: formatCurrency(initialCapital || 0),
      desc: 'Modal setoran awal bisnis',
      formula: null,
      icon: 'PiggyBank',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      badge: capitalGrowth >= 0
        ? { label: `+${capitalGrowthPercent}% Berkembang`, style: 'bg-emerald-100 text-emerald-600' }
        : { label: `${capitalGrowthPercent}% Menyusut`, style: 'bg-rose-100 text-rose-600' }
    },
    {
      title: 'Total Pendapatan',
      value: formatCurrency(totalRevenue),
      desc: 'Pemasukan dari penjualan pada periode ini',
      formula: null,
      icon: 'TrendingUp',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'Total Pengeluaran',
      value: formatCurrency(totalExpenses),
      desc: 'Semua biaya yang dikeluarkan pada periode ini',
      formula: null,
      icon: 'TrendingDown',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      title: 'Laba Bersih',
      value: formatCurrency(netProfit),
      desc: 'Pendapatan dikurangi pengeluaran',
      formula: `${formatCurrency(totalRevenue)} - ${formatCurrency(totalExpenses)}`,
      icon: netProfit >= 0 ? 'ChartColumn' : 'TrendingDown',
      color: netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bgColor: netProfit >= 0 ? 'bg-emerald-600/10' : 'bg-rose-600/10'
    },
    {
      title: 'Nilai Stok Barang',
      value: formatCurrency(stockValue),
      desc: 'Modal yang tersimpan dalam bentuk barang & bahan',
      formula: null,
      icon: 'Package',
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10'
    },
    {
      title: 'Kas Aktual',
      value: formatCurrency(currentEndingCapital),
      desc: 'Total uang tunai yang benar-benar ada (owner + lapak)',
      formula: `${formatCurrency(ownerBalance)} + ${formatCurrency(lapakBalance)}`,
      icon: 'Wallet',
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10'
    },
    {
      title: 'Hasil Audit Kas',
      value: `${formatCurrency(auditDifference)} ${auditDifference < 0 ? '(Kurang)' : auditDifference > 0 ? '(Lebih)' : '(Pas ✓)'}`,
      desc: 'Selisih antara kas aktual dan kas yang seharusnya ada',
      formula: `Kas Aktual ${formatCurrency(currentEndingCapital)} - Seharusnya ${formatCurrency(expectedEndingCapital)}`,
      icon: auditDifference === 0 ? 'CheckCircle' : 'AlertCircle',
      color: auditDifference < 0 ? 'text-red-500' : auditDifference > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: auditDifference < 0 ? 'bg-red-500/10' : auditDifference > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      highlight: true
    }
  ];

  return (
    <ReportCard
      title="Audit & Analisis Keuangan"
      description="Ringkasan keuangan dan hasil audit kas periode ini"
      icon="ShieldCheck"
      iconColor="text-primary"
      iconBgColor="bg-primary/10"
      metrics={analyticsMetrics}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auditCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all hover:shadow-md ${card.highlight
              ? 'lg:col-span-3 border-current/30 shadow-sm'
              : 'border-border'
              } ${card.bgColor}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon name={card.icon} size={20} />
              </div>
              {card.badge && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.badge.style}`}>
                  {card.badge.label}
                </span>
              )}
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
              {card.formula && (
                <p className={`text-[10px] font-mono mt-2 px-2 py-1 rounded-md ${card.bgColor} ${card.color} opacity-80`}>
                  = {card.formula}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ReportCard>
  );
};

export default CombinedAnalyticsSection;