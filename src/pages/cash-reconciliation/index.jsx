import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch';
import useNotification from '../../hooks/useNotification';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { exportToExcel, exportToPdf, prepareCashReconciliationDataForExport } from '../../utils/exportUtils';

const apiUrl = import.meta.env.VITE_API_URL;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\./g, ''));
};

const CashReconciliation = ({ headerTitle, isModal = false }) => {
    const { theme } = useTheme();
    const { showMessage, showError } = useNotification();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Expected values from system
    const [expected, setExpected] = useState({
        tunai: 0,
        transfer: 0,
        gojek: 0,
        total: 0
    });

    const [transactionCount, setTransactionCount] = useState({
        tunai: 0,
        transfer: 0,
        gojek: 0,
        total: 0
    });

    // Actual values (input by user)
    const [actualTunai, setActualTunai] = useState('');
    const [actualTransfer, setActualTransfer] = useState('');
    const [actualGojek, setActualGojek] = useState('');
    const [notes, setNotes] = useState('');

    // Calculated variance
    const variance = {
        tunai: expected.tunai - parseNumber(actualTunai),
        transfer: expected.transfer - parseNumber(actualTransfer),
        gojek: expected.gojek - parseNumber(actualGojek)
    };
    variance.total = variance.tunai + variance.transfer + variance.gojek;

    const actual = {
        tunai: parseNumber(actualTunai),
        transfer: parseNumber(actualTransfer),
        gojek: parseNumber(actualGojek),
        total: parseNumber(actualTunai) + parseNumber(actualTransfer) + parseNumber(actualGojek)
    };

    const [history, setHistory] = useState([]);
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalPages: 1,
        totalItems: 0,
        limit: 10
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        fetchSummary();
        if (currentPage === 1) {
            fetchHistory(1);
        } else {
            setCurrentPage(1);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchHistory(currentPage);
    }, [currentPage]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/summary?date=${selectedDate}`);
            const data = await response.json();

            if (data.message === 'success') {
                setExpected(data.data.expected);
                setTransactionCount(data.data.transactionCount);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            showError('Gagal memuat data transaksi');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (page = 1) => {
        try {
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/history?page=${page}&limit=10&startDate=${historyStartDate}&endDate=${historyEndDate}`);
            const data = await response.json();

            if (data.message === 'success') {
                setHistory(data.data);
                if (data.pagination) {
                    setPagination(data.pagination);
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleApplyFilter = () => {
        if (currentPage === 1) {
            fetchHistory(1);
        } else {
            setCurrentPage(1);
        }
    };

    const handleResetFilter = () => {
        setHistoryStartDate('');
        setHistoryEndDate('');
        if (currentPage === 1) {
            // If already at page 1, manually fetch because clearing dates won't trigger the [historyStartDate, historyEndDate] effect if done together?
            // Actually, the effect [historyStartDate, historyEndDate] handles it.
        } else {
            setCurrentPage(1);
        }
    };

    useEffect(() => {
        if (historyStartDate === '' && historyEndDate === '') {
            fetchHistory(1);
        }
    }, [historyStartDate, historyEndDate]);

    const handleSave = async () => {
        if (!actualTunai && !actualTransfer && !actualGojek) {
            showError('Mohon isi minimal satu metode pembayaran');
            return;
        }

        setSaving(true);
        try {
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    actual_tunai: parseNumber(actualTunai),
                    actual_transfer: parseNumber(actualTransfer),
                    actual_gojek: parseNumber(actualGojek),
                    notes: notes
                })
            });

            const data = await response.json();

            if (data.message === 'success') {
                showMessage('Rekonsiliasi berhasil disimpan');
                fetchHistory(); // Refresh history
            } else {
                showError('Gagal menyimpan rekonsiliasi');
            }
        } catch (error) {
            console.error('Error saving reconciliation:', error);
            showError('Gagal menyimpan rekonsiliasi');
        } finally {
            setSaving(false);
        }
    };

    // Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleReset = () => {
        setActualTunai('');
        setActualTransfer('');
        setActualGojek('');
        setNotes('');
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/${itemToDelete}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.message === 'success') {
                showMessage('Data rekonsiliasi berhasil dihapus');
                fetchHistory(); // Refresh history
                // Also refresh summary if the deleted item was for the currently selected date
                fetchSummary();
            } else {
                showError('Gagal menghapus data rekonsiliasi');
            }
        } catch (error) {
            console.error('Error deleting reconciliation:', error);
            showError('Gagal menghapus data rekonsiliasi');
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const getVarianceStatus = (varianceValue) => {
        if (varianceValue === 0) return { label: 'PAS', color: 'text-green-600', bgColor: 'bg-green-50', icon: 'CheckCircle' };
        if (varianceValue > 0) return { label: 'KURANG', color: 'text-red-600', bgColor: 'bg-red-50', icon: 'AlertCircle' };
        return { label: 'LEBIH', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: 'Info' };
    };

    const breadcrumbPath = [
        { label: 'Dashboard', path: '/main-dashboard', isActive: false },
        { label: 'Rekonsiliasi Kas', path: '/cash-reconciliation', isActive: true }
    ];

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/history?limit=2000&startDate=${historyStartDate}&endDate=${historyEndDate}`);
            const data = await response.json();

            if (data.message === 'success' && data.data.length > 0) {
                const preparedData = prepareCashReconciliationDataForExport(data.data);
                exportToExcel(preparedData, `Laporan_Rekonsiliasi_Kas_${new Date().toISOString().split('T')[0]}`);
            } else {
                showError('Tidak ada data untuk diekspor');
            }
        } catch (error) {
            console.error('Error exporting excel:', error);
            showError('Gagal mengekspor data');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${apiUrl}/api/cash-reconciliation/history?limit=2000&startDate=${historyStartDate}&endDate=${historyEndDate}`);
            const data = await response.json();

            if (data.message === 'success' && data.data.length > 0) {
                const preparedData = prepareCashReconciliationDataForExport(data.data);
                exportToPdf(preparedData, `Laporan_Rekonsiliasi_Kas_${new Date().toISOString().split('T')[0]}`);
            } else {
                showError('Tidak ada data untuk diekspor');
            }
        } catch (error) {
            console.error('Error exporting pdf:', error);
            showError('Gagal mengekspor data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={isModal ? "" : "min-h-screen"}>
            {!isModal && theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}

            <main className={!isModal ? `${theme === 'default' ? 'pt-16' : ''} pb-20 lg:pb-8` : ""}>
                <div className={!isModal && theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 py-6" : ""}>

                    {!isModal && (
                        <div className="mb-6">
                            <BreadcrumbNavigation customPath={breadcrumbPath} />
                            <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary mt-2">
                                Rekonsiliasi Kas Harian
                            </h1>
                            <p className="text-text-secondary mt-1">
                                Cocokkan uang fisik dengan transaksi tercatat
                            </p>
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Pilih Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full sm:w-auto px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchSummary}
                                iconName="RefreshCw"
                                iconPosition="left"
                                loading={loading}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Expected Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="Database" className="text-blue-600 dark:text-blue-400" size={24} />
                            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Uang yang Seharusnya Ada (Sistem)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tunai</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(expected.tunai)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{transactionCount.tunai} transaksi</div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transfer</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(expected.transfer)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{transactionCount.transfer} transaksi</div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gojek</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(expected.gojek)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{transactionCount.gojek} transaksi</div>
                            </div>
                        </div>

                        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-4 text-white">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">TOTAL</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{formatCurrency(expected.total)}</div>
                                    <div className="text-sm opacity-90">{transactionCount.total} transaksi</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actual Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="Wallet" className="text-purple-600 dark:text-purple-400" size={24} />
                            <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                                Uang yang Benar-benar Ada (Fisik)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tunai Fisik
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="text"
                                        value={actualTunai}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setActualTunai(formatNumber(value));
                                        }}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Transfer (Cek Rekening)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="text"
                                        value={actualTransfer}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setActualTransfer(formatNumber(value));
                                        }}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Gojek (Cek Aplikasi)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="text"
                                        value={actualGojek}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setActualGojek(formatNumber(value));
                                        }}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-600 dark:bg-purple-700 rounded-lg p-4 text-white mt-4">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">TOTAL AKTUAL</span>
                                <div className="text-2xl font-bold">{formatCurrency(actual.total)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Variance Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="Calculator" className="text-gray-600 dark:text-gray-400" size={24} />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Selisih (Expected - Actual)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {['tunai', 'transfer', 'gojek'].map((method) => {
                                const status = getVarianceStatus(variance[method]);
                                return (
                                    <div key={method} className={`${status.bgColor} rounded-lg p-4 border-2 ${status.color.replace('text-', 'border-')}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{method}</span>
                                            <Icon name={status.icon} className={status.color} size={20} />
                                        </div>
                                        <div className={`text-2xl font-bold ${status.color}`}>
                                            {formatCurrency(Math.abs(variance[method]))}
                                        </div>
                                        <div className={`text-sm font-semibold ${status.color} mt-1`}>
                                            {status.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`rounded-lg p-4 border-2 ${getVarianceStatus(variance.total).bgColor} ${getVarianceStatus(variance.total).color.replace('text-', 'border-')}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Icon name={getVarianceStatus(variance.total).icon} className={getVarianceStatus(variance.total).color} size={24} />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">TOTAL SELISIH</span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${getVarianceStatus(variance.total).color}`}>
                                        {formatCurrency(Math.abs(variance.total))}
                                    </div>
                                    <div className={`text-sm font-semibold ${getVarianceStatus(variance.total).color}`}>
                                        {getVarianceStatus(variance.total).label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Catatan (Opsional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tambahkan catatan jika ada..."
                            rows={3}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="default"
                            onClick={handleSave}
                            iconName="Save"
                            iconPosition="left"
                            loading={saving}
                            className="flex-1"
                        >
                            Simpan Rekonsiliasi
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            iconName="RotateCcw"
                            iconPosition="left"
                            className="flex-1"
                        >
                            Reset
                        </Button>
                    </div>

                    {/* History Section */}
                    <div className="mt-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Icon name="History" className="text-gray-600 dark:text-gray-400" size={24} />
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Riwayat Rekonsiliasi
                                </h2>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1">
                                    <input
                                        type="date"
                                        value={historyStartDate}
                                        onChange={(e) => setHistoryStartDate(e.target.value)}
                                        className="bg-transparent border-none text-xs focus:ring-0 text-text-primary p-1"
                                    />
                                    <span className="text-text-secondary text-xs">s/d</span>
                                    <input
                                        type="date"
                                        value={historyEndDate}
                                        onChange={(e) => setHistoryEndDate(e.target.value)}
                                        className="bg-transparent border-none text-xs focus:ring-0 text-text-primary p-1"
                                    />
                                    {(historyStartDate || historyEndDate) && (
                                        <button
                                            onClick={handleResetFilter}
                                            className="text-text-secondary hover:text-red-500 p-1"
                                            title="Reset Filter"
                                        >
                                            <Icon name="XCircle" size={14} />
                                        </button>
                                    )}
                                </div>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleApplyFilter}
                                    iconName="Search"
                                    className="sm:w-auto"
                                >
                                    Filter
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportExcel}
                                        iconName="FileSpreadsheet"
                                        className="flex-1 sm:flex-none border-green-600 text-green-600 hover:bg-green-50"
                                        loading={loading && history.length > 0}
                                    >
                                        Excel
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportPdf}
                                        iconName="FileText"
                                        className="flex-1 sm:flex-none border-red-600 text-red-600 hover:bg-red-50"
                                        loading={loading && history.length > 0}
                                    >
                                        PDF
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile View - Cards */}
                        {isMobile ? (
                            <div className="space-y-4">
                                {history.length > 0 ? (
                                    history.map((item) => {
                                        const totalVariance = parseFloat(item.variance_tunai) + parseFloat(item.variance_transfer) + parseFloat(item.variance_gojek);
                                        const status = getVarianceStatus(totalVariance);

                                        return (
                                            <div key={item.id} className="bg-card rounded-lg shadow-sm border border-border p-4">
                                                {/* Header Card */}
                                                <div className="flex justify-between items-start mb-3 pb-3 border-b border-border">
                                                    <div>
                                                        <div className="text-sm font-semibold text-text-primary">
                                                            {new Date(item.date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-text-secondary mt-1">
                                                            User: {item.reconciled_by || '-'}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-2"
                                                        iconName="Trash2"
                                                    />
                                                </div>

                                                {/* Payment Methods */}
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-text-secondary">Tunai (Aktual)</span>
                                                        <span className="text-sm font-medium text-text-primary">
                                                            {formatCurrency(item.actual_tunai)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-text-secondary">Transfer (Aktual)</span>
                                                        <span className="text-sm font-medium text-text-primary">
                                                            {formatCurrency(item.actual_transfer)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-text-secondary">Gojek (Aktual)</span>
                                                        <span className="text-sm font-medium text-text-primary">
                                                            {formatCurrency(item.actual_gojek)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Total Variance & Status */}
                                                <div className="pt-3 border-t border-border">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-xs text-text-secondary mb-1">Total Selisih</div>
                                                            <div className={`text-lg font-bold ${status.color}`}>
                                                                {formatCurrency(Math.abs(totalVariance))}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {item.notes && (
                                                    <div className="pt-3 border-t border-border mt-3">
                                                        <div className="text-xs text-text-secondary mb-1">Catatan</div>
                                                        <div className="text-sm text-text-primary italic">
                                                            {item.notes}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center text-text-secondary">
                                        Belum ada data rekonsiliasi
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Desktop View - Table */
                            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-text-secondary uppercase text-xs font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Tanggal</th>
                                                <th className="px-6 py-3">User</th>
                                                <th className="px-6 py-3">Tunai (Act)</th>
                                                <th className="px-6 py-3">Transfer (Act)</th>
                                                <th className="px-6 py-3">Gojek (Act)</th>
                                                <th className="px-6 py-3">Total Selisih</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Catatan</th>
                                                <th className="px-6 py-3">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {history.length > 0 ? (
                                                history.map((item) => {
                                                    const totalVariance = parseFloat(item.variance_tunai) + parseFloat(item.variance_transfer) + parseFloat(item.variance_gojek);
                                                    const status = getVarianceStatus(totalVariance);

                                                    return (
                                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-text-primary font-medium">
                                                                {new Date(item.date).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                                                {item.reconciled_by || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                                                                {formatCurrency(item.actual_tunai)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                                                                {formatCurrency(item.actual_transfer)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                                                                {formatCurrency(item.actual_gojek)}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap font-bold ${status.color}`}>
                                                                {formatCurrency(Math.abs(totalVariance))}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 max-w-xs">
                                                                <div className="text-sm text-text-primary truncate" title={item.notes || ''}>
                                                                    {item.notes ? (
                                                                        <span className="italic">{item.notes}</span>
                                                                    ) : (
                                                                        <span className="text-text-secondary">-</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    iconName="Trash2"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="9" className="px-6 py-8 text-center text-text-secondary">
                                                        Belum ada data rekonsiliasi
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {history.length > 0 && pagination.totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
                                <div className="text-sm text-text-secondary">
                                    Menampilkan <span className="font-medium text-text-primary">{history.length}</span> dari <span className="font-medium text-text-primary">{pagination.totalItems}</span> data
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        iconName="ChevronLeft"
                                        iconPosition="left"
                                        className="h-9"
                                    >
                                        Sebelumnya
                                    </Button>

                                    <div className="flex items-center gap-1 mx-2">
                                        {[...Array(pagination.totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Show first page, last page, and pages around current page
                                            if (
                                                pageNum === 1 ||
                                                pageNum === pagination.totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                            ? 'bg-primary text-white'
                                                            : 'hover:bg-muted text-text-primary'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === currentPage - 2 ||
                                                pageNum === currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-text-secondary">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                        disabled={currentPage === pagination.totalPages}
                                        iconName="ChevronRight"
                                        iconPosition="right"
                                        className="h-9"
                                    >
                                        Berikutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Rekonsiliasi"
                message="Apakah Anda yakin ingin menghapus data rekonsiliasi ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                isDestructive={true}
            />
        </div>
    );
};

export default CashReconciliation;
