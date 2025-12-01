import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import AppIcon from '../../components/AppIcon';

const apiUrl = import.meta.env.VITE_API_URL;

// Reusable Modal Component, similar to the one in Settings/index.jsx
const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><AppIcon name="X" className="w-6 h-6" /></Button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const DataSyncModal = ({ isOpen, onClose }) => {
  const [timestamps, setTimestamps] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const fetchTimestamps = async () => {
    if (!isOpen) return;
    setIsLoading(true);
    clearMessages();
    try {
      const response = await authFetch(`${apiUrl}/api/all-settings`);
      const data = await response.json();
      if (response.ok) {
        setTimestamps({
          menuStock: data.data?.menu_stock_last_updated,
          rawMaterials: data.data?.raw_materials_last_updated,
          lapakFunds: data.data?.lapak_funds_last_updated,
        });
      } else {
        throw new Error(data.error || 'Gagal memuat data timestamp.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimestamps();
  }, [isOpen]);

  const createSyncHandler = (syncType, endpoint) => {
    return async () => {
      setIsLoading(true);
      clearMessages();
      try {
        const timestampResponse = await authFetch(`${apiUrl}${endpoint}`, {
          method: 'PUT',
        });

        if (!timestampResponse.ok) {
          let errorMessage = `Gagal sinkronisasi ${syncType}.`;
          try {
            const errorData = await timestampResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) { /* Ignore JSON parsing error */ }
          throw new Error(errorMessage);
        }

        await fetchTimestamps(); // Refetch timestamps to show the update
        setMessage(`Data ${syncType} berhasil disinkronkan!`);

      } catch (err) {
        setError(`Error: ${err.message || 'Gagal menyambung ke server.'}`);
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleSyncMenuStock = createSyncHandler('stok menu', '/api/sync/timestamp/menu-stock');
  const handleSyncRawMaterials = createSyncHandler('bahan baku', '/api/sync/timestamp/raw-materials');
  const handleSyncLapakFunds = createSyncHandler('uang lapak', '/api/sync/timestamp/lapak-funds');
  
  const renderTimestamp = (ts) => {
    if (!ts) return 'Belum pernah';
    return new Date(ts).toLocaleString('id-ID', { 
        day: '2-digit', month: 'long', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <Modal title="Sinkronisasi Data" isOpen={isOpen} onClose={onClose}>
        <div className="space-y-4">
            {message && <div className="p-3 bg-success/10 text-success rounded-md text-sm">{message}</div>}
            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sync Card: Menu Stock */}
              <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <AppIcon name="BookUser" size={20} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Update Stok Menu</h3>
                  </div>
                  <p className="text-xs text-text-secondary">Sinkronisasi data harga dan jumlah stok menu.</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary mb-3">
                    {renderTimestamp(timestamps.menuStock)}
                  </p>
                  <Button onClick={handleSyncMenuStock} variant="outline" className="w-full" disabled={isLoading}>
                    <AppIcon name="RefreshCw" size={14} className="mr-2" />
                    {isLoading ? 'Memproses...' : 'Update Sekarang'}
                  </Button>
                </div>
              </div>

              {/* Sync Card: Raw Materials */}
              <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-success/10 rounded-md">
                      <AppIcon name="Package" size={20} className="text-success" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Update Bahan Baku</h3>
                  </div>
                  <p className="text-xs text-text-secondary">Sinkronisasi data stok bahan baku mentah.</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary mb-3">
                    {renderTimestamp(timestamps.rawMaterials)}
                  </p>
                  <Button onClick={handleSyncRawMaterials} variant="outline" className="w-full" disabled={isLoading}>
                    <AppIcon name="RefreshCw" size={14} className="mr-2" />
                    {isLoading ? 'Memproses...' : 'Update Sekarang'}
                  </Button>
                </div>
              </div>

              {/* Sync Card: Lapak Funds */}
              <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/10 rounded-md">
                      <AppIcon name="Wallet" size={20} className="text-accent" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Update Uang Lapak</h3>
                  </div>
                  <p className="text-xs text-text-secondary">Sinkronisasi data saldo kas dan deposit lapak.</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary mb-3">
                    {renderTimestamp(timestamps.lapakFunds)}
                  </p>
                  <Button onClick={handleSyncLapakFunds} variant="outline" className="w-full" disabled={isLoading}>
                    <AppIcon name="RefreshCw" size={14} className="mr-2" />
                    {isLoading ? 'Memproses...' : 'Update Sekarang'}
                  </Button>
                </div>
              </div>
            </div>
        </div>
    </Modal>
  );
};

export default DataSyncModal;
