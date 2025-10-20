import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const MenuItemsTable = ({ 
  menuItems, 
  onUpdateItem, 
  onDeleteItem, 
  onBulkDelete,
  userRole,
  apiUrl
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const scrollRef = useRef(null); // Add this ref

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

  

  const handleEdit = (item) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollTop; // Store current scroll position
    }
    setEditingId(item?.id);
    setEditData({
      name: item?.name,
      stock: item?.stock?.toString(),
      price: item?.price?.toString(),
      image: null, // Changed from image_url
      image_url: item?.image_url // Keep original for display
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const updatedItem = {
        name: editData?.name,
        stock: parseInt(editData?.stock),
        price: parseFloat(editData?.price),
        image: editData?.image, // Pass the file object
        updatedAt: new Date()?.toISOString()
      };
      
      await onUpdateItem(id, updatedItem);
      setEditingId(null);
      setEditData({});
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollTop; // Restore scroll position
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollTop; // Restore scroll position
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteItem(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(menuItems?.map(item => item?.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev?.filter(itemId => itemId !== id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete(selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error bulk deleting items:', error);
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
  const MobileCard = React.memo(({ item, editingId, editData, setEditData, handleEdit, handleSaveEdit, handleCancelEdit, handleSelectItem, selectedItems, setShowDeleteConfirm, apiUrl }) => {
    const stockStatus = getStockStatus(item?.stock);
    const isEditing = editingId === item?.id;
    const isSelected = selectedItems?.includes(item?.id);

    // Local state for stock input
    const [localStock, setLocalStock] = useState(editData?.stock);
    const [localPrice, setLocalPrice] = useState(editData?.price);

    // Update localStock when editData.stock changes (e.g., when editing starts)
    useEffect(() => {
      if (isEditing) {
        setLocalStock(editData?.stock);
        setLocalPrice(editData?.price);
      }
    }, [isEditing, editData?.stock, editData?.price]);

    const handleLocalStockChange = (e) => {
      setLocalStock(e.target.value);
    };

    const handleStockBlur = () => {
      // Update parent state only when input loses focus
      setEditData(prev => ({ ...prev, stock: localStock }));
    };

    const handleLocalPriceChange = (value) => {
      const numericValue = value?.replace(/[^\d]/g, '');
      setLocalPrice(numericValue);
    };

    const handlePriceBlur = () => {
      setEditData(prev => ({ ...prev, price: localPrice }));
    };

    return (
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleSelectItem(item?.id, e?.target?.checked)}
              className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
            />
            <img 
              src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
              alt={item?.name}
              className="w-16 h-16 object-cover rounded-md"
              onError={(e) => { e.target.onerror = null; e.target.src='/assets/images/no_image.png'}}
            />
            <div className="flex-1">
              {isEditing ? (
                <Input
                  type="text"
                  value={editData?.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e?.target?.value }))}
                  className="text-sm"
                />
              ) : (
                <h3 className="font-medium text-foreground">{item?.name}</h3>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stok</p>
            {isEditing ? (
              <Input
                type="number"
                value={Number(localStock)} // Use local state
                onChange={handleLocalStockChange} // Update local state
                onBlur={handleStockBlur} // Update parent state on blur
                min="0"
                className="text-sm"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium">{item?.stock}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus?.color} ${stockStatus?.bg}`}>
                  {stockStatus?.label}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Harga</p>
            {isEditing ? (
              <Input
                type="number"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
                onBlur={handlePriceBlur}
                className="text-sm"
              />
            ) : (
              <p className="font-mono font-medium text-foreground">
                {formatCurrency(item?.price)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Upload Gambar Baru</p>
            {isEditing ? (
              <Input
                type="file"
                name="image"
                onChange={(e) => setEditData(prev => ({ ...prev, image: e.target.files[0] }))}
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-muted-foreground truncate">
                {item?.image_url || 'Tidak ada gambar'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Diperbarui: {new Date(item.updatedAt)?.toLocaleDateString('id-ID')}
          </p>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="success"
                  size="xs"
                  onClick={() => handleSaveEdit(item?.id)}
                  iconName="Check"
                  iconPosition="left"
                >
                  Simpan
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleCancelEdit}
                  iconName="X"
                  iconPosition="left"
                >
                  Batal
                </Button>
              </>
            ) : (
              <>
                {userRole !== 'guest' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => { e.preventDefault(); handleEdit(item); }}
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
            {selectedItems?.length > 0 && (
              <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  iconName="Trash2"
                  iconPosition="left"
                  disabled={userRole === 'guest'}
                >
                  Hapus {selectedItems?.length} item
                </Button>
            )}
          </div>
        </div>
      </div>
      {/* Mobile View */}
      <div className="block lg:hidden p-4 space-y-4" ref={scrollRef}>
        {menuItems?.map(item => (
          <MobileCard 
            key={item?.id} 
            item={item} 
            editingId={editingId}
            editData={editData}
            setEditData={setEditData}
            handleEdit={handleEdit}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            handleSelectItem={handleSelectItem}
            selectedItems={selectedItems}
            setShowDeleteConfirm={setShowDeleteConfirm}
            apiUrl={apiUrl}
          />
        ))}
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedItems?.length === menuItems?.length}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                />
              </th>
              <th className="text-left p-4 font-medium text-foreground">Gambar</th>
              <th className="text-left p-4 font-medium text-foreground">Nama Menu</th>
              <th className="text-left p-4 font-medium text-foreground">Stok</th>
              <th className="text-left p-4 font-medium text-foreground">Harga</th>
              <th className="text-left p-4 font-medium text-foreground w-48">Upload Gambar Baru</th>
              <th className="text-left p-4 font-medium text-foreground">Status</th>
              <th className="text-left p-4 font-medium text-foreground">Terakhir Diperbarui</th>
              <th className="text-center p-4 font-medium text-foreground w-32">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {menuItems?.map(item => {
              const stockStatus = getStockStatus(item?.stock);
              const isEditing = editingId === item?.id;
              const isSelected = selectedItems?.includes(item?.id);

              return (
                <tr key={item?.id} className="hover:bg-muted/50 transition-colors duration-200">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectItem(item?.id, e?.target?.checked)}
                      className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                    />
                  </td>
                  <td className="p-4">
                    <img 
                      src={item?.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
                      alt={item?.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => { e.target.onerror = null; e.target.src='/assets/images/no_image.png'}}
                    />
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editData?.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e?.target?.value }))}
                        className="min-w-48"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{item?.name}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={Number(editData?.stock)}
                        onChange={(e) => setEditData(prev => ({ ...prev, stock: e?.target?.value }))}
                        min="0"
                        className="w-20"
                      />
                    ) : (
                      <span className="font-mono font-medium">{item?.stock}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData?.price}
                        onChange={(e) => setEditData(prev => ({ ...prev, price: e?.target?.value }))}
                        className="min-w-32"
                      />
                    ) : (
                      <span className="font-mono font-medium">{formatCurrency(item?.price)}</span>
                    )}
                  </td>
                  <td className="p-4 overflow-hidden">
                    {isEditing ? (
                      <Input
                        type="file"
                        name="image"
                        onChange={(e) => setEditData(prev => ({ ...prev, image: e.target.files[0] }))}
                        className="w-40"
                      />
                    ) : (
                      <span className="text-sm text-text-secondary truncate">
                        {item?.image_url || 'Tidak ada gambar'}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus?.color} ${stockStatus?.bg}`}>
                      {stockStatus?.label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(item.updatedAt)?.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleSaveEdit(item?.id)}
                            iconName="Check"
                          />
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={handleCancelEdit}
                            iconName="X"
                          />
                        </>
                      ) : (
                        <>
                          {userRole !== 'guest' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleEdit(item)}
                              iconName="Edit"
                            />
                          )}
                          {userRole !== 'guest' && (
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setShowDeleteConfirm(item?.id)}
                              iconName="Trash2"
                            />
                          )}
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