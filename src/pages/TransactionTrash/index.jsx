
import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import TrashTable from './components/TrashTable';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';


const apiUrl = import.meta.env.VITE_API_URL;

const TransactionTrash = ({ headerTitle }) => {
    const { theme } = useTheme();
  const [trashedTransactions, setTrashedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [transactionToPermanentDeleteId, setTransactionToPermanentDeleteId] = useState(null);


  const fetchTrashedTransactions = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/trash`);
      const data = await response.json();
      if (data.message === 'success') {
        setTrashedTransactions(data.data);
      } else {
        console.error('Failed to fetch trashed transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching trashed transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedTransactions();
  }, []);

  const handleRestore = async (id) => {
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${id}/restore`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.message === 'restored') {
        fetchTrashedTransactions(); // Refresh the list
      } else {
        console.error('Failed to restore transaction:', data.error);
      }
    } catch (error) {
      console.error('Error restoring transaction:', error);
    }
  };

  const handleOpenPermanentDeleteConfirm = (id) => {
    setTransactionToPermanentDeleteId(id);
    setShowPermanentDeleteConfirm(true);
  };

  const handleClosePermanentDeleteConfirm = () => {
    setTransactionToPermanentDeleteId(null);
    setShowPermanentDeleteConfirm(false);
  };

  const handlePermanentDelete = async () => {
    if (!transactionToPermanentDeleteId) return;
    
    try {
      const response = await authFetch(`${apiUrl}/api/transactions/${transactionToPermanentDeleteId}/permanent`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'permanently deleted') {
        fetchTrashedTransactions(); // Refresh the list
        handleClosePermanentDeleteConfirm();
      } else {
        console.error('Failed to permanently delete transaction:', data.error);
      }
    } catch (error) {
      console.error('Error permanently deleting transaction:', error);
    }
  };
  
    const breadcrumbPath = [
    { label: 'Dashboard', path: '/main-dashboard', isActive: false },
    { label: 'Riwayat Transaksi', path: '/transaction-history', isActive: false },
    { label: 'Sampah Transaksi', path: '/transaction-trash', isActive: true }
  ];

  return (
    <div className="min-h-screen">
        {theme === 'default' && <NavigationHeader headerTitle={headerTitle} />}
        <main className={`${theme === 'default' ? 'pt-16' : ''} pb-20 lg:pb-8`}>
            <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" : ""}>
                <div className="mb-6">
                    <BreadcrumbNavigation customPath={breadcrumbPath} />
                    <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary mt-2">
                        Sampah Transaksi
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Transaksi yang dihapus akan berada di sini selama 30 hari sebelum dihapus permanen.
                    </p>
                </div>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <TrashTable
                        transactions={trashedTransactions}
                        onRestore={handleRestore}
                        onPermanentDelete={handleOpenPermanentDeleteConfirm}
                    />
                )}
            </div>
        </main>
        {showPermanentDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
                <div className="bg-card rounded-lg p-6 max-w-sm w-full">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-destructive/10 rounded-full">
                            <Icon name="AlertTriangle" size={20} className="text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary">
                            Hapus Permanen
                        </h3>
                    </div>
                    <p className="text-text-secondary mb-6">
                        Apakah Anda yakin ingin menghapus transaksi #{transactionToPermanentDeleteId} secara permanen? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleClosePermanentDeleteConfirm}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handlePermanentDelete}
                            className="flex-1"
                        >
                            Hapus Permanen
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TransactionTrash;
