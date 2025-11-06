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
  onMoveItem
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
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex flex-col items-center space-y-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveItem(item?.id, 'up')}
                disabled={menuItems.indexOf(item) === 0}
                className="h-6 w-6"
              >
                <Icon name="ChevronUp" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveItem(item?.id, 'down')}
                disabled={menuItems.indexOf(item) === menuItems.length - 1}
                className="h-6 w-6"
              >
                <Icon name="ChevronDown" size={16} />
              </Button>
            </div>

            <img 
              src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
              alt={item?.name}
              className="w-16 h-16 object-cover rounded-md"
              onError={(e) => { e.target.onerror = null; e.target.src='/assets/images/no_image.png'}}
            />
            <div className="flex-1">
              <h3 className="font-medium text-foreground flex items-center">
                {item?.name}
                {!!item?.is_featured && <Icon name="Star" size={16} className="text-yellow-500 ml-2" title="Menu Unggulan" />}
              </h3>
              <p className="text-xs text-muted-foreground">{item?.category}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stok</p>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-medium">{item?.stock}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus?.color} ${stockStatus?.bg}`}>
                {stockStatus?.label}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Harga</p>
            <p className="font-mono font-medium text-foreground">
              {formatCurrency(item?.price)}
            </p>
          </div>
          {item?.discount > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Diskon</p>
              <p className="font-mono font-medium text-success">
                {`${(item?.discount * 100).toFixed(0)}%`}
              </p>
            </div>
          )}

        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Diperbarui: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('id-ID') : '-'}
          </p>
          
          <div className="flex items-center space-x-2">
            {userRole !== 'guest' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onEditItem(item)}
                iconName="Edit"
                iconPosition="left"
              >
                Edit
              </Button>
            )}
            {userRole !== 'guest' && (
              <Button
                variant="destructive"
                size="xs"
                onClick={() => setShowDeleteConfirm(item?.id)}
                iconName="Trash2"
                iconPosition="left"
              >
                Hapus
              </Button>
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
    <div className="bg-card rounded-lg shadow-elevation-1 border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">
              {menuItems?.length} item menu tersedia
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
          </div>
        </div>
      </div>
      {/* Mobile View */}
      <div className="block lg:hidden p-4 space-y-4">
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
          <thead className="bg-muted"><tr><th className="text-left p-4 w-20">Urutan</th><th className="text-left p-4 font-medium text-foreground">Gambar</th><th className="text-left p-4 font-medium text-foreground">Nama Menu</th><th className="text-left p-4 font-medium text-foreground">Kategori</th><th className="text-left p-4 font-medium text-foreground w-20">Stok</th><th className="text-left p-4 font-medium text-foreground">Harga</th><th className="text-left p-4 font-medium text-foreground">Diskon</th><th className="text-left p-4 font-medium text-foreground">Unggulan</th><th className="text-left p-4 font-medium text-foreground">Status</th><th className="text-left p-4 font-medium text-foreground">Terakhir Diperbarui</th><th className="text-center p-4 font-medium text-foreground w-32">Aksi</th></tr></thead>
          <tbody className="divide-y divide-border">
            {menuItems?.map(item => {
              const stockStatus = getStockStatus(item?.stock);

              return (<tr key={item?.id} className="hover:bg-muted/50 transition-colors duration-200"><td className="p-4">
                <div className="flex flex-col items-center space-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveItem(item?.id, 'up')}
                    disabled={menuItems.indexOf(item) === 0}
                    className="h-6 w-6"
                  >
                    <Icon name="ChevronUp" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveItem(item?.id, 'down')}
                    disabled={menuItems.indexOf(item) === menuItems.length - 1}
                    className="h-6 w-6"
                  >
                    <Icon name="ChevronDown" size={16} />
                  </Button>
                </div>
              </td><td className="p-4"><img src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'} alt={item?.name} className="w-16 h-16 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.src='/assets/images/no_image.png'}}/></td><td className="p-4"><span className="font-medium text-foreground">{item?.name}</span></td><td className="p-4"><span className="font-medium text-foreground">{item?.category}</span></td><td className="p-4"><span className="font-mono font-medium">{item?.stock}</span></td><td className="p-4"><span className="font-mono font-medium">{formatCurrency(item?.price)}</span></td><td className="p-4 text-center"> {/* New data cell */}{item?.discount > 0 ? (<span className="font-mono font-medium text-success">{`${(item?.discount * 100).toFixed(0)}%`}</span>) : (<span className="text-muted-foreground">-</span>)}</td><td className="p-4">{item?.is_featured ? <Icon name="Star" size={18} className="text-yellow-500" title="Menu Unggulan" /> : '-'}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus?.color} ${stockStatus?.bg}`}>{stockStatus?.label}</span></td><td className="p-4 text-sm text-muted-foreground">{item.updatedAt ? (!isNaN(new Date(item.updatedAt)) ? new Date(item.updatedAt).toLocaleDateString('id-ID', {day: '2-digit',month: '2-digit',year: 'numeric',hour: '2-digit',minute: '2-digit'}) : `Invalid Date: ${item.updatedAt}`) : '-'}</td><td className="p-4"><div className="flex items-center justify-center space-x-2">{userRole !== 'guest' && (<Button variant="ghost" size="xs" onClick={() => onEditItem(item)} iconName="Edit"/>)}{userRole !== 'guest' && (<Button variant="destructive" size="xs" onClick={() => setShowDeleteConfirm(item?.id)} iconName="Trash2"/>)}</div></td></tr>);
            })}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-4">
          <div className="bg-card rounded-lg shadow-elevation-3 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={24} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Konfirmasi Hapus</h3>
                <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus menu "{menuItems?.find(item => item?.id === showDeleteConfirm)?.name}"?
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
                iconName="Trash2"
                iconPosition="left"
                className="flex-1"
              >
                Ya, Hapus
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemsTable;