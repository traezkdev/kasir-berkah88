import React from 'react';
import Icon from '../../../components/AppIcon';

const ProfitLossIndicator = ({ revenue = 0, expenses = 0, periodLabel = 'Bulan Ini' }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(Math.abs(amount));
  };

  // Parse revenue and expenses to numbers, handling possible formatted strings (e.g., "Rp 1.000")
  const rev = typeof revenue === 'string' ? Number(revenue.replace(/[^0-9.-]+/g, '')) : Number(revenue);
  const exp = typeof expenses === 'string' ? Number(expenses.replace(/[^0-9.-]+/g, '')) : Number(expenses);
  const profit = rev - exp;
  const isProfit = profit >= 0;
  const formattedProfit = formatCurrency(profit);
  const displayProfit = `${isProfit ? '' : '-'}${formattedProfit}`;
  const formattedRevenue = formatCurrency(rev);
  const formattedExpenses = formatCurrency(exp);

  // Widget removed per user request – component renders nothing
  return null;
};

export default ProfitLossIndicator;
