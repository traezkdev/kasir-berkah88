import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { FaChevronDown, FaChevronRight, FaBoxOpen } from 'react-icons/fa';

const HppReport = ({ headerTitle = 'Laporan HPP & Laba' }) => {
  const { theme } = useTheme();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchReport = async (sd = startDate, ed = endDate) => {
    setIsLoading(true);
    setExpandedRows({});
    try {
      let query = '';
      if (sd && ed) query = `?startDate=${sd}&endDate=${ed}`;
      else if (sd) query = `?startDate=${sd}`;
      else if (ed) query = `?endDate=${ed}`;

      const response = await authFetch(`/api/reports/hpp${query}`);
      const result = await response.json();

      if (result.message === 'success') {
        setReportData(result.data);
        setCurrentPage(1); // Reset halaman saat memuat data baru
      } else {
        toast.error('Gagal memuat laporan HPP.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan.');
      console.error('Fetch Report Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatRupiah = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Preset filter cepat
  const applyPreset = (preset) => {
    const now = new Date();
    let sd = today, ed = today;
    if (preset === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      sd = d.toISOString().split('T')[0];
    } else if (preset === 'month') {
      sd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }
    setStartDate(sd);
    setEndDate(ed);
    fetchReport(sd, ed);
  };

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <NavigationHeader headerTitle={headerTitle || 'Laporan HPP & Laba'} />
      )}
      <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? 'max-w-7xl mx-auto px-4 lg:px-6 space-y-6' : 'max-w-7xl mx-auto space-y-6'}>

          {theme === 'default' && (
            <div className="mb-4 hidden md:block pt-4">
              <BreadcrumbNavigation
                items={[
                  { label: 'Dashboard', path: '/main-dashboard' },
                  { label: 'Laporan HPP & Laba', path: '/hpp-report' },
                ]}
              />
            </div>
          )}

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{headerTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Laporan penjualan, modal (HPP), dan laba bersih berdasarkan rincian komponen biaya per menu.
            </p>
          </div>

          {/* Filter Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Rentang Waktu</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mulai Tanggal</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sampai Tanggal</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                </div>
                <Button type="submit" isLoading={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                  Terapkan
                </Button>
              </form>
              {/* Preset Buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { label: 'Hari Ini', preset: 'today' },
                  { label: '7 Hari Terakhir', preset: 'week' },
                  { label: 'Bulan Ini', preset: 'month' },
                ].map(({ label, preset }) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Penjualan */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Penjualan</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(reportData.summary.totalRevenue)}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Total HPP */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Modal (HPP)</p>
                  <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatRupiah(reportData.summary.totalHpp)}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Laba Bersih</p>
                  <h3 className={`text-2xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {formatRupiah(reportData.summary.netProfit)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Table dengan Accordion */}
          {reportData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rincian per Menu</h2>
                <span className="ml-auto text-xs text-gray-400">Klik baris untuk melihat detail komponen HPP</span>
              </div>
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Menu</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty Terjual</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Penjualan</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Modal</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Laba Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reportData.breakdown.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <FaBoxOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Tidak ada data penjualan pada rentang tanggal ini.</p>
                        </td>
                      </tr>
                    ) : (
                      reportData.breakdown.map((item) => {
                        const isExpanded = !!expandedRows[item.id];
                        const hasComponents = item.components && item.components.length > 0;
                        return (
                          <React.Fragment key={item.id}>
                            {/* Baris Utama */}
                            <tr
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${hasComponents ? 'cursor-pointer' : ''}`}
                              onClick={() => hasComponents && toggleRow(item.id)}
                            >
                              <td className="px-4 py-3 text-center">
                                {hasComponents ? (
                                  isExpanded
                                    ? <FaChevronDown className="w-3.5 h-3.5 text-indigo-500 inline" />
                                    : <FaChevronRight className="w-3.5 h-3.5 text-gray-400 inline" />
                                ) : (
                                  <span className="w-3.5 h-3.5 inline-block" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {item.name}
                                {!hasComponents && (
                                  <span className="ml-2 text-xs text-gray-400 italic font-normal">(belum ada komponen HPP)</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                  {item.quantitySold}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                                {formatRupiah(item.totalRevenue)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-orange-600 dark:text-orange-400 font-medium">
                                {formatRupiah(item.totalHpp)}
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-semibold ${item.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {formatRupiah(item.netProfit)}
                              </td>
                            </tr>

                            {/* Baris Accordion: Detail Komponen HPP */}
                            {isExpanded && hasComponents && (
                              <tr className="bg-indigo-50/60 dark:bg-indigo-900/10">
                                <td colSpan="6" className="px-6 py-3">
                                  <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                                      Detail Komponen Modal — {item.name} ({item.quantitySold} pcs terjual)
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {item.components.map((comp, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800 px-3 py-2 text-sm">
                                          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{comp.name}</p>
                                          <p className="font-semibold text-orange-600 dark:text-orange-400 mt-0.5">{formatRupiah(comp.totalCost)}</p>
                                          <p className="text-xs text-gray-400">
                                            ({formatRupiah(comp.totalCost / item.quantitySold)} × {item.quantitySold})
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>

                  {/* Footer Total */}
                  {reportData.breakdown.length > 0 && (
                    <tfoot className="bg-gray-50 dark:bg-gray-900/40 border-t-2 border-gray-200 dark:border-gray-600">
                      <tr>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white">Total Keseluruhan</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                          {reportData.breakdown.reduce((s, i) => s + i.quantitySold, 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-800 dark:text-white">
                          {formatRupiah(reportData.summary.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-orange-600 dark:text-orange-400">
                          {formatRupiah(reportData.summary.totalHpp)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${reportData.summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {formatRupiah(reportData.summary.netProfit)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden p-4 space-y-4">
                {reportData.breakdown.length === 0 ? (
                  <div className="text-center py-10">
                    <FaBoxOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Tidak ada data penjualan pada rentang tanggal ini.</p>
                  </div>
                ) : (
                  reportData.breakdown.map((item) => {
                    const isExpanded = !!expandedRows[item.id];
                    const hasComponents = item.components && item.components.length > 0;
                    return (
                      <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="pl-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.name}</h3>
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 mt-1 border border-indigo-100">
                              Terjual: {item.quantitySold} porsi
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${item.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                              {formatRupiah(item.netProfit)}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Laba</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-b border-gray-100 dark:border-gray-700 py-3 mb-3 bg-gray-50 dark:bg-gray-900/30 -mx-4 px-4">
                          <div>
                            <span className="text-gray-500 text-xs block mb-0.5">Penjualan</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{formatRupiah(item.totalRevenue)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 text-xs block mb-0.5">Total Modal</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{formatRupiah(item.totalHpp)}</span>
                          </div>
                        </div>

                        {hasComponents ? (
                          <div>
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold py-1 bg-indigo-50/50 dark:bg-indigo-900/20 px-3 rounded"
                            >
                              <span>{isExpanded ? 'Tutup Detail Modal' : 'Lihat Detail Modal'}</span>
                              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-3 space-y-2">
                                {item.components.map((comp, i) => (
                                  <div key={i} className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-700 pb-1.5 last:border-0 last:pb-0">
                                    <span className="text-gray-600 dark:text-gray-400">{comp.name}</span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">{formatRupiah(comp.totalCost)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50 dark:bg-gray-800 rounded">Belum ada komponen HPP</p>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Mobile Footer Total */}
                {reportData.breakdown.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/40 dark:to-gray-800 border border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 mt-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Total Keseluruhan
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Total Terjual</span>
                        <span className="font-bold text-gray-900 dark:text-white">{reportData.breakdown.reduce((s, i) => s + i.quantitySold, 0)} porsi</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Total Penjualan</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(reportData.summary.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Total Modal</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{formatRupiah(reportData.summary.totalHpp)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-indigo-100 dark:bg-indigo-900/60 px-3 py-2.5 rounded border border-indigo-200 dark:border-indigo-700 mt-2">
                        <span className="font-bold text-indigo-900 dark:text-indigo-100">Total Laba</span>
                        <span className={`font-black text-lg ${reportData.summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {formatRupiah(reportData.summary.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rekap Global per Bahan */}
          {reportData && reportData.globalIngredients && reportData.globalIngredients.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rekap Total Pengeluaran per Bahan</h2>
                <span className="ml-auto text-xs text-gray-400">Total belanja untuk setiap komponen bahan di semua menu</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Bahan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Digunakan di Menu</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Modal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reportData.globalIngredients
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((ing, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {ing.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-xs truncate" title={ing.usedInMenus.join(', ')}>
                            {ing.usedInMenus.join(', ')}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-orange-600 dark:text-orange-400 font-medium">
                            {formatRupiah(ing.totalCost)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900/40 border-t-2 border-gray-200 dark:border-gray-600">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white sm:col-span-2">Total Semua Bahan</td>
                      <td className="px-4 py-3 hidden sm:table-cell"></td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-orange-600 dark:text-orange-400">
                        {formatRupiah(reportData.globalIngredients.reduce((sum, ing) => sum + ing.totalCost, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination Controls */}
              {reportData.globalIngredients.length > itemsPerPage && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(reportData.globalIngredients.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(reportData.globalIngredients.length / itemsPerPage)}
                      variant="outline"
                      size="sm"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-medium">{Math.min(currentPage * itemsPerPage, reportData.globalIngredients.length)}</span> dari <span className="font-medium">{reportData.globalIngredients.length}</span> bahan
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Halaman {currentPage} dari {Math.ceil(reportData.globalIngredients.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(reportData.globalIngredients.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(reportData.globalIngredients.length / itemsPerPage)}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty / Loading */}
          {isLoading && !reportData && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default HppReport;
