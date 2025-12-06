import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import authFetch from '../../../utils/authFetch';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const apiUrl = import.meta.env.VITE_API_URL;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

const DailyRecapPopup = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recapData, setRecapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecapData = async () => {
    if (!selectedDate) {
      setError('Silakan pilih tanggal terlebih dahulu.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecapData(null);
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/daily-recap?date=${selectedDate}`);
      const data = await response.json();
      if (data.message === 'success') {
        setRecapData(data.data);
      } else {
        throw new Error(data.error || 'Gagal mengambil data rekap.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!recapData || !selectedDate) return;

    const title = `Rekap Harian - ${selectedDate}`;
    const headers = ["Deskripsi", "Total"];
    const data = [
      ["Total Tunai", formatCurrency(recapData.total_tunai)],
      ["Total Transfer", formatCurrency(recapData.total_transfer)],
      ["Total Gojek", formatCurrency(recapData.total_gojek)],
      ["Total Makan Karyawan", formatCurrency(recapData.total_makan_karyawan)],
      ["Total Keseluruhan", formatCurrency(recapData.grand_total)],
    ];

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [20, 83, 45] },
      });
      doc.save(`rekap-harian-${selectedDate}.pdf`);
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data.map(row => Object.values(row))]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap');
      XLSX.writeFile(workbook, `rekap-harian-${selectedDate}.xlsx`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-card rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Rekap Data Harian</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <Icon name="X" size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="recap-date" className="block text-sm font-medium text-text-secondary mb-1">
              Pilih Tanggal
            </label>
            <input
              type="date"
              id="recap-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-text-primary focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={fetchRecapData} disabled={isLoading} className="w-full">
            {isLoading ? 'Memuat...' : 'Tampilkan Rekap'}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm mt-4">{error}</p>}

        {recapData && (
          <div className="mt-6">
            <h4 className="font-semibold text-text-primary mb-2">Hasil Rekap untuk {selectedDate}</h4>
            <table className="w-full text-sm text-left text-text-secondary">
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-text-primary">Total Pemasukan Tunai</td>
                  <td className="py-2 text-right">{formatCurrency(recapData.total_tunai)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-text-primary">Total Pemasukan Transfer</td>
                  <td className="py-2 text-right">{formatCurrency(recapData.total_transfer)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-text-primary">Total Pemasukan Gojek</td>
                  <td className="py-2 text-right">{formatCurrency(recapData.total_gojek)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-text-primary">Total Makan Karyawan</td>
                  <td className="py-2 text-right">{formatCurrency(recapData.total_makan_karyawan)}</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <td className="py-2 font-bold text-text-primary">Total Keseluruhan</td>
                  <td className="py-2 text-right font-bold text-text-primary">{formatCurrency(recapData.grand_total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex space-x-3 mt-6">
              <Button variant="outline" onClick={() => handleExport('pdf')} className="flex-1">
                <Icon name="FileText" className="mr-2" size={16} />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')} className="flex-1">
                <Icon name="FileSheet" className="mr-2" size={16} />
                Export Excel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecapPopup;
