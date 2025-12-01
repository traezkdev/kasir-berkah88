
import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import TrashTable from './components/TrashTable';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';


const apiUrl = import.meta.env.VITE_API_URL;

const TransactionTrash = ({ headerTitle }) => {
    const { theme } = useTheme();
  const [trashedTransactions, setTrashedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini secara permanen?')) {
      try {
        const response = await authFetch(`${apiUrl}/api/transactions/${id}/permanent`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.message === 'permanently deleted') {
          fetchTrashedTransactions(); // Refresh the list
        } else {
          console.error('Failed to permanently delete transaction:', data.error);
        }
      } catch (error) {
        console.error('Error permanently deleting transaction:', error);
      }
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
                        onPermanentDelete={handlePermanentDelete}
                    />
                )}
            </div>
        </main>
    </div>
  );
};

export default TransactionTrash;
