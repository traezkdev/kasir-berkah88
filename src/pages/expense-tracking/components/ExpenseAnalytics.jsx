import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';

const ExpenseAnalytics = ({ expenses = [], className = "" }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const categoryTranslations = {
    supplies: 'Bahan Baku & Supplies',
    electricity_water: 'Listrik & Air',
    inventory_purchase: 'Pembelian Stok',
    equipment: 'Peralatan',
    maintenance_repair: 'Perawatan & Perbaikan',
    transportation: 'Transportasi',
    marketing: 'Promosi & Marketing',
    other_operational: 'Operasional Lainnya',
    miscellaneous: 'Lain-lain',
  };

  // Generate category breakdown data
  const getCategoryBreakdown = () => {
    const categoryTotals = {};
    
    expenses?.forEach(expense => {
      const category = expense?.categoryLabel || expense?.category;
      categoryTotals[category] = (categoryTotals?.[category] || 0) + parseFloat(expense?.amount || 0);
    });

    const totalExpensesSum = expenses?.reduce((sum, exp) => sum + parseFloat(exp?.amount || 0), 0);

    const allCategoriesData = Object.keys(categoryTranslations)?.map(key => {
      const amount = categoryTotals[key] || 0;
      return {
        category: categoryTranslations[key],
        amount,
        percentage: totalExpensesSum > 0 ? ((amount / totalExpensesSum) * 100)?.toFixed(1) : 0
      };
    });

    return allCategoriesData?.sort((a, b) => b?.amount - a?.amount);
  };

  // Generate daily expenses for the last 7 days
  const getDailyExpenses = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date?.setDate(date?.getDate() - i);
      
      const dayExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate?.toDateString() === date?.toDateString();
      });

      const totalAmount = dayExpenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
      
      last7Days?.push({
        date: date?.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        amount: totalAmount,
        count: dayExpenses?.length
      });
    }
    
    return last7Days;
  };

  const categoryData = getCategoryBreakdown();
  const dailyData = getDailyExpenses();

  const pieColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
  ];

  if (expenses?.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-elevation-2 border border-slate-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="BarChart3" size={32} className="text-text-secondary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Belum Ada Data Analytics</h3>
          <p className="text-text-secondary">
            Tambahkan beberapa pengeluaran untuk melihat analisis dan grafik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg shadow-md border border-border dark:bg-dark-card dark:border-dark-border dark:shadow-dark-md ${className}`}>
      <div className="p-4 lg:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="BarChart3" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Analytics Pengeluaran</h3>
            <p className="text-sm text-text-secondary">Analisis pola pengeluaran bisnis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Daily Expenses Chart */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-text-primary">Pengeluaran 7 Hari Terakhir</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000)}K`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value), 'Pengeluaran']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#EF4444" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-text-primary">Breakdown per Kategori</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({ category, percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {categoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors?.[index % pieColors?.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value), 'Total']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Legend */}
        <div className="mt-6 pt-6 border-t border-border dark:border-dark-border">
          <h4 className="text-md font-medium text-text-primary mb-4">Detail Kategori</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryData?.map((item, index) => (
              <div key={item?.category} className="flex items-center space-x-3 p-3 bg-background-alt rounded-lg dark:bg-dark-background-alt">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pieColors?.[index % pieColors?.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item?.category}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {item?.percentage}% • {formatCurrency(item?.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;