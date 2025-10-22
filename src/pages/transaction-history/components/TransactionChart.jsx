import React, { useMemo } from 'react';
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

const TransactionChart = ({ transactions, filterType, currentDailyDate, onNextDayRange, onPrevDayRange }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    let filteredByDateRange = [...transactions];

    if (filterType === 'daily') {
      const endDate = new Date(currentDailyDate);
      const startDate = new Date(currentDailyDate);
      startDate.setDate(endDate.getDate() - 6); // 7 days including the end date

      filteredByDateRange = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        // Set hours, minutes, seconds, milliseconds to 0 for accurate date comparison
        transactionDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    const aggregatedData = {};

    filteredByDateRange.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      let key;

      if (filterType === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
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

    // Ensure all 7 days are present in daily view, even if no transactions
    if (filterType === 'daily') {
      const labels = [];
      const counts = [];
      const totals = [];
      const endDate = new Date(currentDailyDate);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(endDate.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(key);
        counts.push(aggregatedData[key]?.count || 0);
        totals.push(aggregatedData[key]?.total || 0);
      }
      return {
        labels,
        datasets: [
          {
            label: 'Jumlah Transaksi',
            data: counts,
            borderColor: 'rgba(59, 130, 246, 1)', // Light blue
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-count', // Assign to a specific Y-axis
          },
          {
            label: 'Total Nominal Transaksi',
            data: totals,
            borderColor: 'rgba(16, 185, 129, 1)', // Green
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-total', // Assign to a specific Y-axis
          },
        ],
      };
    } else {
      const sortedKeys = Object.keys(aggregatedData).sort();
      const labels = sortedKeys;
      const counts = sortedKeys.map(key => aggregatedData[key].count);
      const totals = sortedKeys.map(key => aggregatedData[key].total);

      return {
        labels,
        datasets: [
          {
            label: 'Jumlah Transaksi',
            data: counts,
            borderColor: 'rgba(59, 130, 246, 1)', // Light blue
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-count', // Assign to a specific Y-axis
          },
          {
            label: 'Total Nominal Transaksi',
            data: totals,
            borderColor: 'rgba(16, 185, 129, 1)', // Green
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y-total', // Assign to a specific Y-axis
          },
        ],
      };
    }
  }, [transactions, filterType, currentDailyDate]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grafik Riwayat Transaksi',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#333',
      },
    },
    scales: {
      x: {
        type: 'time', // Use time scale for better date handling
        time: {
          unit: filterType === 'daily' ? 'day' : filterType === 'weekly' ? 'week' : 'month',
          tooltipFormat: filterType === 'daily' ? 'dd MMM yyyy' : filterType === 'weekly' ? 'dd MMM yyyy' : 'MMM yyyy',
          displayFormats: {
            day: 'dd MMM',
            week: 'dd MMM',
            month: 'MMM yyyy',
          },
        },
        title: {
          display: true,
          text: 'Tanggal Transaksi',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#555',
        },
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: 'rgba(200, 200, 200, 0.2)', // Subtle grid lines
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
          color: '#555',
        },
        grid: {
          drawOnChartArea: false, // Only draw grid lines for one Y-axis
        },
        ticks: {
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null; // Hide non-integer ticks
          },
          stepSize: 1, // Ensure integer steps
        },
      },
      'y-total': {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Nominal Transaksi (Rp)',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#555',
        },
        grid: {
          drawOnChartArea: false, // Only draw grid lines for one Y-axis
        },
        ticks: {
          callback: function(value) {
            return 'Rp ' + value.toLocaleString('id-ID');
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      {filterType === 'daily' && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
          <button
            onClick={onPrevDayRange}
            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 w-full sm:w-auto"
          >
            &larr; Sebelumnya
          </button>
          <span className="text-md font-semibold text-center">
            {chartData.labels.length > 0 ? 
              `${new Date(chartData.labels[0]).toLocaleDateString()} - ${new Date(chartData.labels[chartData.labels.length - 1]).toLocaleDateString()}`
              : 'Pilih Tanggal'}
          </span>
          <button
            onClick={onNextDayRange}
            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 w-full sm:w-auto"
          >
            Berikutnya &rarr;
          </button>
        </div>
      )}
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TransactionChart;
