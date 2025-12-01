import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { FaSync, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CriticalStockPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchLowStockItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/stock-alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLowStockItems(response.data.data);
    } catch (err) {
      console.error("Error fetching low stock items:", err);
      setError("Gagal memuat data stok kritis.");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {

      fetchLowStockItems();

    }, []);

    return (

        <div className="min-h-screen bg-background">
        <OwnerNavigationHeader headerTitle="Stok Kritis" />
        <main className="pb-20 lg:pb-8 pt-16">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="mb-6 mt-4">
              <BreadcrumbNavigation className="mb-4" />
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                Stok Kritis
              </h1>
              <p className="text-text-secondary mt-1">
                Daftar bahan baku yang perlu segera dibeli.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/owner-dashboard')}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
                >
                  <FaArrowLeft className="mr-2" /> Kembali
                </button>
                <button
                  onClick={fetchLowStockItems}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto"
                  disabled={loading}
                >
                  <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Memuat...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            {error && <div className="p-4 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>}

            {loading ? (
              <div className="text-center py-8">Memuat data...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8 px-4 bg-success/10 text-success rounded-lg">
                <p className="text-lg">👍 Semua stok dalam kondisi aman. Tidak ada yang perlu dibeli saat ini.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto bg-card rounded-lg shadow">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nama Bahan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Stok Saat Ini
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Stok Menu
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Total Stok
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Stok Minimum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Saran Pembelian
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Notifikasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {lowStockItems.map((item) => (
                        <tr key={item.id} className="bg-destructive/10 hover:bg-destructive/20">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground flex items-center">
                            <FaExclamationTriangle className="text-destructive mr-2" />
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">
                            {parseInt(item.current_stock)} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">
                            {parseInt(item.menu_stock)} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-bold">
                            {parseInt(item.current_stock) + parseInt(item.menu_stock)} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {parseInt(item.stok_minimum)} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-bold">
                            {parseInt(item.suggestion_purchase_quantity)} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                            {item.deficit > 0 ? `Stok menipis, kurang ${parseInt(item.deficit)} dari standar.` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="bg-card rounded-lg shadow border border-destructive/50 p-4">
                      <div className="flex items-center pb-2 mb-3 border-b border-border">
                        <FaExclamationTriangle className="text-destructive mr-3 flex-shrink-0" />
                        <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div className="font-medium text-muted-foreground">Stok Saat Ini:</div>
                        <div className="text-destructive font-bold">{parseInt(item.current_stock)} {item.unit}</div>
                        
                        <div className="font-medium text-muted-foreground">Stok Menu:</div>
                        <div className="text-destructive font-bold">{parseInt(item.menu_stock)} {item.unit}</div>
                        
                        <div className="font-medium text-muted-foreground">Total Stok:</div>
                        <div className="text-foreground font-bold">{parseInt(item.current_stock) + parseInt(item.menu_stock)} {item.unit}</div>
                        
                        <div className="font-medium text-muted-foreground">Stok Minimum:</div>
                        <div className="text-foreground">{parseInt(item.stok_minimum)} {item.unit}</div>
                        
                        <div className="font-medium text-muted-foreground">Estimasi Porsi:</div>
                        <div className="text-foreground">{item.estimated_menu_portions !== null ? `${parseInt(item.estimated_menu_portions)} porsi` : 'N/A'}</div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="font-medium text-muted-foreground text-sm">Saran Pembelian:</div>
                        <div className="text-success font-bold text-lg">{parseInt(item.suggestion_purchase_quantity)} {item.unit}</div>
                        {item.deficit > 0 && (
                          <div className="text-destructive text-sm mt-2">
                            Notifikasi: Stok menipis, kurang {parseInt(item.deficit)} dari standar.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
                      </div>
                    </main>
                  </div>    );
  }; // Close of CriticalStockPage function

export default CriticalStockPage;

  