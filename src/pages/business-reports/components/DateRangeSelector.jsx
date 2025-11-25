import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DateRangeSelector = ({ onDateRangeChange, selectedRange = 'today' }) => {
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeRange, setActiveRange] = useState(selectedRange);

  const presetRanges = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: 'week', label: '7 Hari' },
    { key: 'month', label: '30 Hari' },
    { key: 'custom', label: 'Custom' }
  ];

  const handlePresetSelect = (range) => {
    setActiveRange(range);
    
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return;
    }

    onDateRangeChange({ startDate, endDate, range });
  };

  const handleCustomDateChange = (startDateStr, endDateStr) => {
    if (startDateStr && endDateStr) {
      // Parse date parts to avoid timezone issues with `new Date(string)`
      const startParts = startDateStr.split('-').map(p => parseInt(p, 10));
      const endParts = endDateStr.split('-').map(p => parseInt(p, 10));

      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      endDate.setHours(23, 59, 59, 999);
      
      onDateRangeChange({
        startDate,
        endDate,
        range: 'custom'
      });
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <h3 className="text-sm font-medium text-text-primary mb-3 dark:text-white">Periode Laporan</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {presetRanges?.map((range) => (
          <Button
            key={range?.key}
            variant={activeRange === range?.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetSelect(range?.key)}
          >
            {range?.label}
          </Button>
        ))}
      </div>
      {activeRange === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Tanggal Mulai"
            value={customStartDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              setCustomStartDate(newStartDate);
              if (newStartDate && customEndDate) {
                handleCustomDateChange(newStartDate, customEndDate);
              }
            }}
          />
          <Input
            type="date"
            label="Tanggal Akhir"
            value={customEndDate}
            onChange={(e) => {
              const newEndDate = e.target.value;
              setCustomEndDate(newEndDate);
              if (customStartDate && newEndDate) {
                handleCustomDateChange(customStartDate, newEndDate);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;