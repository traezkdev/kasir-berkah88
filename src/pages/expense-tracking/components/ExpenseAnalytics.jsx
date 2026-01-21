import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useTheme } from '../../../contexts/ThemeContext';

const ExpenseAnalytics = ({ expenses = [], className = "" }) => {
  const { theme } = useTheme();
  const [categories, setCategories] = useState([]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authFetch('/api/expense-categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch expense categories in analytics:", err);
      }
    };

    fetchCategories();
  }, []);

  // Generate category breakdown data
  const getCategoryBreakdown = () => {
    const categoryTotals = {};

    expenses?.forEach(expense => {
      const category = expense?.category;
      categoryTotals[category] = (categoryTotals?.[category] || 0) + parseFloat(expense?.amount || 0);
    });

    const totalExpensesSum = expenses?.reduce((sum, exp) => sum + parseFloat(exp?.amount || 0), 0);

    // If categories are fetched, use them. Otherwise fallback to unique categories in expenses
    const categoriesToUse = categories.length > 0
      ? categories.map(c => c.name)
      : [...new Set(expenses.map(e => e.category))];

    const allCategoriesData = categoriesToUse?.map(catName => {
      const amount = categoryTotals[catName] || 0;
      return {
        category: catName,
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
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-800">
            <Icon name="BarChart3" size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-2">Belum Ada Data Analytics</h3>
          <p className="text-sm font-medium text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
            Tambahkan beberapa pengeluaran untuk<br />melihat analisis dan grafik finansial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${className}`}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Icon name="BarChart3" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none mb-1.5">Wawasan Pengeluaran</h3>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Analisis pola biaya operasional bisnis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Daily Expenses Chart */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Trend 7 Hari Terakhir</h4>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) => `${(value / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{
                      backgroundColor: theme === 'default' ? '#fff' : '#0f172a',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                    formatter={(value) => [formatCurrency(value), 'Biaya']}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#F43F5E"
                    radius={[10, 10, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Proporsi Kategori</h4>
            </div>
            <div className="h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.filter(d => d.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {categoryData.filter(d => d.amount > 0)?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors?.[index % pieColors?.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'default' ? '#fff' : '#0f172a',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Legend */}
        <div className="mt-12 pt-10 border-t border-gray-50 dark:border-slate-700/50">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Rincian Alokasi Biaya</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryData?.map((item, index) => (
              <div key={item?.category} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-50 dark:border-slate-800 transition-all hover:border-gray-100">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-[10px] text-white"
                  style={{ backgroundColor: pieColors?.[index % pieColors?.length] }}
                >
                  {item?.percentage}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight truncate">
                    {item?.category}
                  </p>
                  <p className="text-sm font-bold text-gray-400 dark:text-slate-500">
                    {formatCurrency(item?.amount)}
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