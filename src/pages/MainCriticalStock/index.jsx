import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationHeader from '../../components/ui/NavigationHeader';
import { FaSync, FaExclamationTriangle } from 'react-icons/fa';

const MainCriticalStockPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <>
      <NavigationHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Daftar Pembelian Stok (Stok Kritis)</h1>
          <div className="w-full sm:w-auto"> {/* Wrapper for the button */}
            <button
              onClick={fetchLowStockItems}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto"
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
          <div className="text-center py-8 px-4 bg-green-50 text-green-700 rounded-lg">
            <p className="text-lg">👍 Semua stok dalam kondisi aman. Tidak ada yang perlu dibeli saat ini.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Bahan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Tersisa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Minimum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimasi Porsi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saran Pembelian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="bg-red-50 hover:bg-red-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 font-bold">
                        {parseInt(item.current_stock)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseInt(item.stok_minimum)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.estimated_menu_portions !== null ? `${parseInt(item.estimated_menu_portions)} porsi` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                        {parseInt(item.suggestion_purchase_quantity)} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow border border-red-200 p-4">
                  <div className="flex items-center pb-2 mb-3 border-b border-gray-200">
                    <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="font-medium text-gray-600">Stok Tersisa:</div>
                    <div className="text-red-700 font-bold">{parseInt(item.current_stock)} {item.unit}</div>
                    
                    <div className="font-medium text-gray-600">Stok Minimum:</div>
                    <div>{parseInt(item.stok_minimum)} {item.unit}</div>
                    
                    <div className="font-medium text-gray-600">Estimasi Porsi:</div>
                    <div>{item.estimated_menu_portions !== null ? `${parseInt(item.estimated_menu_portions)} porsi` : 'N/A'}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="font-medium text-gray-600 text-sm">Saran Pembelian:</div>
                    <div className="text-green-700 font-bold text-lg">{parseInt(item.suggestion_purchase_quantity)} {item.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MainCriticalStockPage;