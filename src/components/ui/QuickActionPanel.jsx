import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const QuickActionPanel = ({ className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getContextualActions = () => {
    const currentPath = location?.pathname;

    const actionSets = {
      '/main-dashboard': [
        { label: 'Transaksi Baru', icon: 'Plus', action: () => navigate('/transaksi'), color: 'primary' },
        { label: 'Tambah Menu', icon: 'UtensilsCrossed', action: () => navigate('/menu-management'), color: 'secondary' },
        { label: 'Catat Pengeluaran', icon: 'Receipt', action: () => navigate('/expense-tracking'), color: 'accent' },
        { label: 'Lihat Laporan', icon: 'FileText', action: () => navigate('/business-reports'), color: 'muted' }
      ],
      '/transaksi': [
        { label: 'Transaksi Baru', icon: 'Plus', action: () => window.location?.reload(), color: 'primary' },
        { label: 'Riwayat Hari Ini', icon: 'Clock', action: () => navigate('/transaction-history'), color: 'secondary' },
        { label: 'Kelola Menu', icon: 'Settings', action: () => navigate('/menu-management'), color: 'muted' }
      ],
      '/menu-management': [
        { label: 'Tambah Menu', icon: 'Plus', action: () => { }, color: 'primary' },
        { label: 'Import Menu', icon: 'Upload', action: () => { }, color: 'secondary' },
        { label: 'Kategori', icon: 'Tag', action: () => { }, color: 'accent' }
      ],
      '/expense-tracking': [
        { label: 'Tambah Pengeluaran', icon: 'Plus', action: () => { }, color: 'primary' },
        { label: 'Template', icon: 'Copy', action: () => { }, color: 'secondary' },
        { label: 'Kategori', icon: 'Tag', action: () => { }, color: 'accent' }
      ],
      '/transaction-history': [
        { label: 'Export Data', icon: 'Download', action: () => { }, color: 'primary' },
        { label: 'Filter', icon: 'Filter', action: () => { }, color: 'secondary' },
        { label: 'Cetak', icon: 'Printer', action: () => { }, color: 'accent' }
      ],
      '/business-reports': [
        { label: 'Export Laporan', icon: 'Download', action: () => { }, color: 'primary' },
        { label: 'Jadwal Otomatis', icon: 'Calendar', action: () => { }, color: 'secondary' },
        { label: 'Bagikan', icon: 'Share', action: () => { }, color: 'accent' }
      ]
    };

    return actionSets?.[currentPath] || actionSets?.['/main-dashboard'];
  };

  const actions = getContextualActions();

  return (
    <>
      {/* Mobile View */}
      <div className={`lg:hidden fixed bottom-20 right-4 z-500 ${className}`}>
        {isExpanded && (
          <div className="mb-3 space-y-2">
            {actions?.slice(1)?.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action?.action}
                className="w-full justify-start shadow-elevation-2 bg-white"
                iconName={action?.icon}
                iconPosition="left"
              >
                {action?.label}
              </Button>
            ))}
          </div>
        )}
        <div className="flex flex-col items-end space-y-2">
          {actions?.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-12 h-12 rounded-full shadow-elevation-2 bg-white border border-slate-200"
            >
              <Icon name={isExpanded ? "X" : "MoreHorizontal"} size={20} />
            </Button>
          )}

          <Button
            variant={actions?.[0]?.color}
            size="icon"
            onClick={actions?.[0]?.action}
            className="w-14 h-14 rounded-full shadow-elevation-3"
          >
            <Icon name={actions?.[0]?.icon} size={24} />
          </Button>
        </div>
      </div>

      {/* Desktop View */}
      <div className={`hidden lg:block fixed right-6 top-1/2 transform -translate-y-1/2 z-500 ${className}`}>
        <div className="flex flex-col items-end space-y-2">
          {isDesktopExpanded && (
            <div className="bg-white rounded-lg shadow-elevation-2 border border-slate-200 p-2 space-y-1">
              {actions?.slice(1)?.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action?.action}
                  className="w-full justify-start"
                  iconName={action?.icon}
                  iconPosition="left"
                >
                  {action?.label}
                </Button>
              ))}
            </div>
          )}
          {actions?.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
              className="w-12 h-12 rounded-full shadow-elevation-2 bg-white border border-slate-200"
            >
              <Icon name={isDesktopExpanded ? "X" : "MoreHorizontal"} size={20} />
            </Button>
          )}
          <Button
            variant={actions?.[0]?.color}
            size="icon"
            onClick={actions?.[0]?.action}
            className="w-14 h-14 rounded-full shadow-elevation-3"
          >
            <Icon name={actions?.[0]?.icon} size={24} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default QuickActionPanel;