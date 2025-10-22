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

const TransactionChart = ({ transactions, filterType }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const aggregatedData = {};

    transactions.forEach(transaction => {
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
        aggregatedData[key] = 0;
      }
      aggregatedData[key] += parseFloat(transaction.total || 0);
    });

    const sortedKeys = Object.keys(aggregatedData).sort();
    const labels = sortedKeys;
    const data = sortedKeys.map(key => aggregatedData[key]);

    return {
      labels,
      datasets: [
        {
          label: 'Total Nominal Transaksi',
          data: data,
          borderColor: 'rgba(59, 130, 246, 1)', // Light blue
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [transactions, filterType]);

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
      y: {
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
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: 'rgba(200, 200, 200, 0.2)', // Subtle grid lines
        },
        ticks: {
          callback: function(value) {
            return 'Rp ' + value.toLocaleString('id-ID');
          }
        }
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TransactionChart;
