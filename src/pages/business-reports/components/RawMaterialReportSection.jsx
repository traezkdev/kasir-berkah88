import React, { useState } from 'react';
import ReportCard from './ReportCard';
import Icon from '../../../components/AppIcon';
import Pagination from '../../../components/ui/Pagination';
import { exportToExcel, exportToPdf, prepareRawMaterialStockDataForExport } from '../../../utils/exportUtils';
import { formatInTimeZone } from 'date-fns-tz';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const RawMaterialReportSection = ({ data, units, dateRange }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (!data) return null;

    const { totalMenuStockValue, totalStockValue, lowStockRawCount, currentRawMaterialStockValue, rawMaterials } = data;

    // Pagination logic for low stock materials
    const lowStockMaterials = rawMaterials ? rawMaterials.filter(m => (Number(m.current_stock) + Number(m.menu_stock)) < Number(m.stok_minimum)) : [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLowStockItems = lowStockMaterials.slice(indexOfFirstItem, indexOfLastItem);

    const metrics = [
        { label: 'Total Nilai Stok Menu', value: formatCurrency(totalMenuStockValue) },
        { label: 'Total Nilai Stok', value: formatCurrency(totalStockValue) },
        { label: 'Bahan Stok Menipis', value: `${lowStockRawCount} Jenis` },
        { label: 'Nilai Stok Bahan Mentah', value: formatCurrency(currentRawMaterialStockValue) }
    ];

    const handleExportPdf = () => {
        const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
        const startDateStr = dateRange ? formatInTimeZone(dateRange.startDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
        const endDateStr = dateRange ? formatInTimeZone(dateRange.endDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
        const filename = `Laporan_Stok_Bahan_Mentah_${startDateStr}_sd_${endDateStr}`;
        exportToPdf(dataToExport, filename, dateRange);
    };

    const handleExportExcel = () => {
        const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
        const startDateStr = dateRange ? formatInTimeZone(dateRange.startDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
        const endDateStr = dateRange ? formatInTimeZone(dateRange.endDate, 'Asia/Jakarta', 'dd-MM-yyyy') : 'all';
        const filename = `Laporan_Stok_Bahan_Mentah_${startDateStr}_sd_${endDateStr}`;
        exportToExcel(dataToExport, filename);
    };

    const exportOptions = [
        { label: 'Export PDF', onClick: handleExportPdf },
        { label: 'Export Excel', onClick: handleExportExcel },
    ];

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <ReportCard
            title="Laporan Bahan Mentah"
            description="Analisis stok bahan mentah dan estimasi nilai kapital inventori"
            icon="Archive"
            iconColor="text-blue-500"
            iconBgColor="bg-blue-500/10"
            metrics={metrics}
            exportOptions={exportOptions}
        >
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
                        <Icon name="AlertTriangle" size={16} className="text-destructive mr-2" />
                        Bahan Mentah Menipis
                    </h4>
                    <div className="space-y-2">
                        {currentLowStockItems.length > 0 ? (
                            currentLowStockItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                                    <div>
                                        <p className="font-medium text-text-primary">{item.name}</p>
                                        <p className="text-sm text-text-secondary">
                                            Stok: {(Number(item.current_stock) || 0) + (Number(item.menu_stock) || 0)} {item.unit} (Min: {item.stok_minimum})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm text-text-primary">
                                            {formatCurrency(item.raw_stock_price)} / {item.unit}
                                        </p>
                                        <div className="flex items-center text-xs text-destructive">
                                            <Icon name="TrendingDown" size={12} className="mr-1" />
                                            Critical
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-4 text-text-secondary">Tidak ada bahan mentah dengan stok menipis.</p>
                        )}
                    </div>

                    <Pagination
                        itemsPerPage={itemsPerPage}
                        totalItems={lowStockMaterials.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </div>
            </div>
        </ReportCard>
    );
};

export default RawMaterialReportSection;
