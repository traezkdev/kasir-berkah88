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
  const [formData, setFormData] = useState(() => {
    if (menuItem) {
      return {
        name: menuItem.name,
        price: menuItem.price.toString(),
        stock: menuItem.stock.toString(),
        category: menuItem.category,
        image_url: menuItem.image_url,
        image: null,
        discount: menuItem.discount ? menuItem.discount.toString() : '0.00', // Add discount
      };
    }
    return {};
  });

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        price: menuItem.price.toString(),
        stock: menuItem.stock.toString(),
        category: menuItem.category,
        image_url: menuItem.image_url,
        image: null,
        discount: menuItem.discount ? menuItem.discount.toString() : '0.00', // Add discount
      });
    } else {
      setFormData({}); // Clear form data when menuItem is null
    }
  }, [menuItem]);

  if (!isOpen) return null;

  const handleFormChange = ({ name, value, files }) => {
    if (name === 'image') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value });
  };

  const handleSubmit = async () => {
    // Prepare data for onSave
    const dataToSave = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      image: formData.image, // Pass the file object if new image selected
      discount: parseFloat(formData.discount || '0.00'), // Add discount
    };
    await onSave(menuItem.id, dataToSave);
    onClose(); // Close modal after saving
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Menu Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
        <AddMenuItemForm
          initialData={formData}
          onAddItem={handleSubmit} // Reusing onAddItem for submission
          userRole={userRole}
          isEditing={true}
          onCategoryChange={handleCategoryChange}
          onFormChange={handleFormChange}
        />
      </div>
    </div>
  );
};

export default EditMenuItemModal;