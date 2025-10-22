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
    
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday?.setDate(yesterday?.getDate() - 1);
        startDate = endDate = yesterday;
        break;
      case 'week':
        startDate = new Date(today);
        startDate?.setDate(startDate?.getDate() - 7);
        endDate = today;
        break;
      case 'month':
        startDate = new Date(today);
        startDate?.setDate(startDate?.getDate() - 30);
        endDate = today;
        break;
      default:
        return;
    }

    onDateRangeChange({ startDate, endDate, range });
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange({
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate),
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
            onChange={(e) => setCustomStartDate(e?.target?.value)}
          />
          <Input
            type="date"
            label="Tanggal Akhir"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e?.target?.value);
              if (customStartDate && e?.target?.value) {
                setTimeout(handleCustomDateChange, 100);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;