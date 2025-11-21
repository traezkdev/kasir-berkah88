import React, { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler // Import Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import date-fns adapter

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler // Register Filler
);

const TransactionChart = ({ transactions, filterType }) => {
  const [chartTextColor, setChartTextColor] = useState('#333'); // Default light mode color
  const [chartGridColor, setChartGridColor] = useState('rgba(200, 200, 200, 0.2)'); // Default light mode color

  useEffect(() => {
    const htmlElement = document.documentElement;
    const isDarkMode = htmlElement.classList.contains('dark');

    if (isDarkMode) {
      setChartTextColor('#E0E0E0'); // Light gray for dark mode text
      setChartGridColor('rgba(255, 255, 255, 0.1)'); // Lighter grid for dark mode
    } else {
      setChartTextColor('#333'); // Dark gray for light mode text
      setChartGridColor('rgba(200, 200, 200, 0.2)'); // Darker grid for light mode
    }
  }, []); // Run once on mount

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        datasets: [],
      };
    }

    const aggregatedData = {};

    transactions.forEach(transaction => {
        // Exclude 'Makan Karyawan' transactions for consistency with MetricsCard
        if (transaction.payment_method === 'Makan Karyawan') {
            return;
        }

      const date = new Date(transaction.timestamp);
      let key;

      if (filterType === 'daily') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD local
      } else if (filterType === 'weekly') {
        // Get the start of the week (Monday)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const startOfWeek = new Date(date.setDate(diff));
        key = startOfWeek.toISOString().split('T')[0];
      } else if (filterType === 'monthly') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = { count: 0, total: 0 };
      }
      aggregatedData[key].count += 1;
      aggregatedData[key].total += parseFloat(transaction.total || 0);
    });

    // Generate labels dynamically based on available data and fill gaps
    const allDates = transactions.map(t => {
        const d = new Date(t.timestamp);
        if (filterType === 'daily') return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        if (filterType === 'weekly') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff)).toISOString().split('T')[0];
        }
        if (filterType === 'monthly') return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        return '';
    }).filter(Boolean);

    const uniqueSortedLabels = [...new Set(allDates)].sort((a, b) => new Date(a) - new Date(b));

    const countsData = uniqueSortedLabels.map(key => ({
      x: key,
      y: aggregatedData[key]?.count || 0
    }));

    const totalsData = uniqueSortedLabels.map(key => ({
      x: key,
      y: aggregatedData[key]?.total || 0
    }));

    return {
      datasets: [
        {
          label: 'Jumlah Transaksi',
          data: countsData,
          borderColor: 'rgba(59, 130, 246, 1)', // Light blue
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y-count', // Assign to a specific Y-axis
        },
        {
          label: 'Total Nominal Transaksi',
          data: totalsData,
          borderColor: 'rgba(16, 185, 129, 1)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y-total', // Assign to a specific Y-axis
        },
      ],
    };
  }, [transactions, filterType]);

  const options = useMemo(() => {
    // Helper function to get the start of the next unit for a given date
    const getEndOfUnit = (dateString, type) => {
      const d = new Date(dateString);
      if (type === 'daily') {
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);
        return nextDay.setHours(0, 0, 0, 0); // Start of next day
      } else if (type === 'weekly') {
        // For weekly, we want the start of the next week
        const nextWeek = new Date(d);
        nextWeek.setDate(d.getDate() + 7);
        return nextWeek.setHours(0, 0, 0, 0); // Start of next week
      } else if (type === 'monthly') {
        // For monthly, we want the start of the next month
        const nextMonth = new Date(d);
        nextMonth.setMonth(d.getMonth() + 1);
        return nextMonth.setHours(0, 0, 0, 0); // Start of next month
      }
      return d.getTime(); // Fallback
    };

    // Helper function to get the start of the current unit for a given date
    const getStartOfUnit = (dateString, type) => {
      const d = new Date(dateString);
      if (type === 'daily') {
        return d.setHours(0, 0, 0, 0); // Start of current day
      } else if (type === 'weekly') {
        // Get the start of the week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const startOfWeek = new Date(d.setDate(diff));
        return startOfWeek.setHours(0, 0, 0, 0); // Start of current week
      } else if (type === 'monthly') {
        // Start of current month
        return new Date(d.getFullYear(), d.getMonth(), 1).setHours(0, 0, 0, 0);
      }
      return d.getTime(); // Fallback
    };

    let xMin = undefined;
    let xMax = undefined;

    if (chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0) {
      const firstDataPointX = chartData.datasets[0].data[0].x;
      const lastDataPointX = chartData.datasets[0].data[chartData.datasets[0].data.length - 1].x;
      xMin = getStartOfUnit(firstDataPointX, filterType);
      xMax = getEndOfUnit(lastDataPointX, filterType);
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: chartTextColor, // Dynamic color
          },
        },
        title: {
          display: true,
          text: 'Grafik Riwayat Transaksi',
          font: {
            size: 18,
            weight: 'bold',
          },
          color: chartTextColor, // Dynamic color
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.dataset.yAxisID === 'y-total') {
                label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
              } else {
                label += context.parsed.y;
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time', // Use time scale for better date handling
          bounds: 'ticks', // Ensure chart extends to tick boundaries
          time: {
            unit: filterType === 'daily' ? 'day' : filterType === 'weekly' ? 'week' : 'month',
            tooltipFormat: filterType === 'daily' ? 'dd MMM yyyy' : filterType === 'weekly' ? 'dd MMM yyyy' : 'MMM yyyy',
            displayFormats: {
              day: 'dd MMM',
              week: 'dd MMM',
              month: 'MMM yyyy',
            },
          },
          max: xMax,
          min: xMin,
          title: {
            display: true,
            text: 'Tanggal Transaksi',
            font: {
              size: 14,
              weight: 'bold',
            },
            color: chartTextColor, // Dynamic color
          },
          grid: {
            display: true,
            drawOnChartArea: true,
            drawTicks: true,
            color: chartGridColor, // Dynamic color
          },
          ticks: {
            color: chartTextColor, // Dynamic color
          },
        },
        'y-count': {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Jumlah Transaksi',
            font: {
              size: 14,
              weight: 'bold',
            },
            color: chartTextColor, // Dynamic color
          },
          grid: {
            drawOnChartArea: false, // Only draw grid lines for one Y-axis
            color: chartGridColor, // Dynamic color
          },
          ticks: {
            callback: function(value) {
              if (Number.isInteger(value)) {
                return value;
              }
              return null; // Hide non-integer ticks
            },
            stepSize: 1, // Ensure integer steps
            color: chartTextColor, // Dynamic color
          },
        },
        'y-total': {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Nominal Transaksi',
            font: {
              size: 14,
              weight: 'bold',
            },
            color: chartTextColor, // Dynamic color
          },
          grid: {
            drawOnChartArea: false, // Only draw grid lines for one Y-axis
            color: chartGridColor, // Dynamic color
          },
          ticks: {
            callback: function(value) {
              return 'Rp ' + value.toLocaleString('id-ID');
            },
            color: chartTextColor, // Dynamic color
          },
        },
      },
    };
  }, [filterType, chartTextColor, chartGridColor, chartData]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TransactionChart;
