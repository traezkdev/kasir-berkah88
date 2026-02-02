import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useTheme } from '../../../contexts/ThemeContext';

const MenuItemsTable = ({
  menuItems,
  onUpdateItem,
  onDeleteItem,
  userRole,
  apiUrl,
  onEditItem,
  onMoveItem,
  onOpenRecipeModal
}) => {
  const { theme } = useTheme();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    })?.format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'text-error', bg: 'bg-error/10', label: 'Habis' };
    if (stock <= 5) return { color: 'text-warning', bg: 'bg-warning/10', label: 'Menipis' };
    return { color: 'text-success', bg: 'bg-success/10', label: 'Tersedia' };
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteItem(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };




  const formatPrice = (value) => {
    if (!value) return '';
    const numericValue = value?.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('id-ID')?.format(numericValue);
  };

  const handlePriceChange = (value) => {
    const numericValue = value?.replace(/[^\d]/g, '');
    setEditData(prev => ({
      ...prev,
      price: numericValue
    }));
  };

  // Mobile Card View
  const MobileCard = React.memo(({ item, setShowDeleteConfirm, apiUrl, onEditItem }) => {
    const stockStatus = getStockStatus(item?.stock);

    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl mb-4 border border-gray-100 dark:border-slate-700 shadow-sm active:scale-[0.98] transition-all duration-200">
        <div className="flex items-start gap-5 mb-5">
          <div className="relative">
            <img
              src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
              alt={item?.name}
              className="w-24 h-24 object-cover rounded-xl shadow-inner border border-gray-50 dark:border-slate-700"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/no_image.png' }}
            />
            {!!item?.is_featured && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md z-10">
                <Icon name="Star" size={12} className="text-white fill-current" />
              </div>
            )}
            {item?.discount > 0 && (
              <div className="absolute -top-2 -left-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-1 rounded-lg shadow-md border-2 border-white dark:border-slate-800 z-10 animate-bounce">
                {parseFloat(item.discount).toFixed(0)}% OFF
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item?.category}</span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight truncate">
                {item?.name}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Harga</p>
                <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                  {formatCurrency(item?.price)}
                </p>
              </div>
              <div className="h-6 w-[1px] bg-gray-100 dark:bg-slate-700"></div>
              <div>
                <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Stok</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{item?.stock}</span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${item?.stock === 0 ? 'bg-rose-500' : item?.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] ${stockStatus?.color} ${stockStatus?.bg}`}>
            {stockStatus?.label}
          </div>

          <div className="flex items-center gap-2">
            {userRole !== 'guest' && (
              <>
                <button
                  onClick={() => onEditItem(item)}
                  className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center active:scale-90 transition-all border border-blue-100 dark:border-blue-800/30"
                >
                  <Icon name="Pencil" size={20} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(item?.id)}
                  className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center active:scale-90 transition-all border border-rose-100 dark:border-rose-800/30"
                >
                  <Icon name="Trash2" size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  });

  MobileCard.displayName = 'MobileCard';

  if (menuItems?.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-elevation-1 border border-border p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="UtensilsCrossed" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {'Menu tidak ditemukan'}
          </h3>
          <p className="text-muted-foreground">
            {'Tidak ada menu yang cocok dengan filter yang dipilih'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:bg-card lg:rounded-2xl lg:shadow-sm lg:border lg:border-border overflow-hidden">
      {/* Header - Desktop Only */}
      <div className="hidden lg:block p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">
              {menuItems?.length} item menu tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Item Count - Minimalist */}
      <div className="block lg:hidden mb-4">
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          Daftar Menu ({menuItems?.length})
        </p>
      </div>
      {/* Mobile View */}
      <div className="block lg:hidden py-4 space-y-4">
        {menuItems?.map(item => (
          <MobileCard
            key={item?.id}
            item={item}
            setShowDeleteConfirm={setShowDeleteConfirm}
            apiUrl={apiUrl}
            onEditItem={onEditItem}
          />
        ))}
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="text-left p-4 w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutan</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gambar</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Menu</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
              <th className="text-left p-4 w-20 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Diskon</th>
              <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unggulan</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Update</th>
              <th className="text-center p-4 w-40 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {menuItems?.map(item => {
              const stockStatus = getStockStatus(item?.stock);

              return (
                <tr key={item?.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200">
                  <td className="p-4">
                    <div className="flex flex-col items-center space-y-1">
                      <button
                        onClick={() => onMoveItem(item?.id, 'up')}
                        disabled={menuItems.indexOf(item) === 0}
                        className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 disabled:opacity-30 transition-all"
                      >
                        <Icon name="ChevronUp" size={18} />
                      </button>
                      <button
                        onClick={() => onMoveItem(item?.id, 'down')}
                        disabled={menuItems.indexOf(item) === menuItems.length - 1}
                        className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 disabled:opacity-30 transition-all"
                      >
                        <Icon name="ChevronDown" size={18} />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <img
                      src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
                      alt={item?.name}
                      className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/no_image.png' }}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white tracking-tight">{item?.name}</span>
                      {item?.description && (
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-widest">
                      {item?.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900 dark:text-white">{item?.stock}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(item?.price)}</span>
                  </td>
                  <td className="p-4">
                    {item?.discount > 0 ? (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {parseFloat(item?.discount).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {item?.is_featured ? (
                      <div className="w-8 h-8 bg-amber-50 rounded-md flex items-center justify-center">
                        <Icon name="Star" size={16} className="text-amber-500 fill-current" />
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4">
                    {item?.total_reviews > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-800/30">
                          <Icon name="Star" size={10} className="text-amber-500 fill-current" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400">{parseFloat(item.average_rating).toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">({item.total_reviews})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600 font-bold italic">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${stockStatus?.color} ${stockStatus?.bg}`}>
                      {stockStatus?.label}
                    </div>
                  </td>
                  <td className="p-4 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {userRole !== 'guest' && (
                        <>
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Icon name="Pencil" size={18} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(item?.id)}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 dark:text-rose-400 transition-colors"
                          >
                            <Icon name="Trash2" size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/30">
                <Icon name="Trash2" size={32} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Hapus Menu?</h3>
              <p className="text-sm font-medium text-gray-400 dark:text-slate-500">
                Menu "{menuItems?.find(item => item?.id === showDeleteConfirm)?.name}" akan dihapus permanen.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all"
              >
                Ya, Hapus Sekarang
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full py-4 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MenuItemsTable);