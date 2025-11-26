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
        discount: menuItem.discount ? menuItem.discount.toString() : '0.00',
        is_featured: !!menuItem.is_featured,
        options: menuItem.options || [], // Initialize options
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
      discount: parseFloat(finalFormData.discount || '0.00'),
      is_featured: finalFormData.is_featured,
      options: finalFormData.options || [], // Include options in the save payload
    };
    await onSave(menuItem.id, dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Menu Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
        <AddMenuItemForm
          initialData={formData}
          onAddItem={handleSubmit} // The form will call this with its final state
          userRole={userRole}
          isEditing={true}
          // The form now manages its own state, so direct change handlers are less critical
          // However, if you need to react to changes in the modal, you can use onFormChange
          onFormChange={(field) => {
              setFormData(prev => ({...prev, [field.name]: field.value}))
          }}
        />
      </div>
    </div>
  );
};

export default EditMenuItemModal;