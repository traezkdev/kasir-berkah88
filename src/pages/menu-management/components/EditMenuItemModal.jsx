import React, { useState, useEffect } from 'react';
import AddMenuItemForm from './AddMenuItemForm';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const EditMenuItemModal = ({
  isOpen,
  onClose,
  menuItem,
  onSave,
  userRole,
}) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        price: menuItem.price.toString(),
        stock: menuItem.stock.toString(),
        category: menuItem.category,
        image_url: menuItem.image_url,
        image: null,
        discount: menuItem.discount ? menuItem.discount.toString() : '0',
        is_featured: !!menuItem.is_featured,
        is_hidden: !!menuItem.is_hidden, // Add is_hidden
        options: menuItem.options || [], // Initialize options
        description: menuItem.description || '',
      });
    } else {
      setFormData(null); // Clear form data when modal is closed
    }
  }, [menuItem]);

  if (!isOpen || !formData) return null;

  const handleFormChange = ({ name, value, files }) => {
    const newFormData = { ...formData };
    if (name === 'image') {
      newFormData[name] = files[0];
    } else if (name === 'is_featured') {
      newFormData[name] = value;
    } else {
      newFormData[name] = value;
    }
    setFormData(newFormData);
  };

  // This function will be called by the child form on any change
  const handleFullFormChange = (updatedFormData) => {
    setFormData(updatedFormData);
  }

  const handleSubmit = async (finalFormData) => {
    // The AddMenuItemForm now manages its own state, so we receive the final state on submit
    const dataToSave = {
      name: finalFormData.name,
      price: parseFloat(finalFormData.price),
      stock: parseInt(finalFormData.stock),
      category: finalFormData.category,
      image: finalFormData.image,
      discount: parseFloat(finalFormData.discount || '0'),
      is_featured: finalFormData.is_featured,
      is_hidden: finalFormData.is_hidden, // Add is_hidden
      options: finalFormData.options || [], // Include options in the save payload
      description: finalFormData.description,
    };
    await onSave(menuItem.id, dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end lg:items-center justify-center p-0 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div
        className="relative w-full lg:max-w-5xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden
                   lg:mx-auto lg:h-[90vh] lg:rounded-2xl flex flex-col
                   fixed lg:relative top-0 lg:top-auto bottom-0 left-0 right-0 h-screen
                   rounded-none animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 right-0 p-6 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Icon name="Pencil" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Edit Item Menu</h2>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{menuItem?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-95"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-6">
            <AddMenuItemForm
              initialData={formData}
              onAddItem={handleSubmit}
              userRole={userRole}
              isEditing={true}
              onFormChange={(field) => {
                setFormData(prev => ({ ...prev, [field.name]: field.value }))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMenuItemModal;