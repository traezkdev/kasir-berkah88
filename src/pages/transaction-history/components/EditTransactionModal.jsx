import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select'; // Assuming Select component exists

const EditTransactionModal = ({
  isOpen,
  onClose,
  transaction,
  onUpdateTransaction,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    timestamp: '',
    total: '',
    ppn: '',
    isEmployeeMeal: false,
    payment_method: 'Tunai',
    manual_discount: '',
  });
  const [originalTotal, setOriginalTotal] = useState(0);

  useEffect(() => {
    if (transaction) {
      const date = new Date(transaction.timestamp);
      const formattedDate = date.toISOString().slice(0, 16);

      // Calculate the original total before any manual discount was applied
      const initialTotal = parseFloat(transaction.total) + parseFloat(transaction.manual_discount || 0);
      setOriginalTotal(initialTotal);

      setFormData({
        timestamp: formattedDate,
        total: transaction.total.toString(),
        ppn: transaction.ppn.toString(),
        payment_method: transaction.payment_method || 'Tunai',
        manual_discount: transaction.manual_discount ? transaction.manual_discount.toString() : '0',
      });
    }
  }, [transaction]);

  // Effect to recalculate total when manual_discount changes
  useEffect(() => {
    // Only run if the modal is open and we have an original total
    if (isOpen && originalTotal > 0) {
      const discount = parseFloat(formData.manual_discount || 0);
      
      // Ensure discount is not greater than the original total
      if (discount > originalTotal) {
        // Optionally, you can reset the discount or show an error
        // For now, we'll just cap it at the original total
        setFormData(prev => ({
          ...prev,
          manual_discount: originalTotal.toString(),
          total: '0.00'
        }));
      } else {
        const newTotal = originalTotal - discount;
        setFormData(prev => ({
          ...prev,
          total: newTotal.toFixed(2)
        }));
      }
    }
  }, [formData.manual_discount, originalTotal, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.timestamp || !formData.total) {
      alert('Tanggal, waktu, dan total transaksi wajib diisi.');
      return;
    }

    const updatedTimestamp = new Date(formData.timestamp).toISOString();
    const isEmployeeMealValue = formData.payment_method === 'Makan Karyawan' ? 1 : 0;

    const dataToUpdate = {
      timestamp: updatedTimestamp,
      total: parseFloat(formData.total),
      ppn: parseFloat(formData.ppn),
      isEmployeeMeal: isEmployeeMealValue, // Derived from payment_method
      payment_method: formData.payment_method,
      manual_discount: parseFloat(formData.manual_discount),
    };

    await onUpdateTransaction(transaction.id, dataToUpdate);
    onClose();
  };

  const paymentMethodOptions = [
    { value: 'Tunai', label: 'Tunai' },
    { value: 'Gojek', label: 'Gojek' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Makan Karyawan', label: 'Makan Karyawan' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Transaksi #{transaction?.id}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Tanggal & Waktu Transaksi"
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Input
              label="Total Transaksi"
              type="number"
              name="total"
              value={formData.total}
              onChange={handleChange}
              required
              step="0.01"
            />
          </div>
          <div>
            <Input
              label="PPN"
              type="number"
              name="ppn"
              value={formData.ppn}
              onChange={handleChange}
              required
              step="0.01"
            />
          </div>
          <div>
            <Input
              label="Diskon Manual"
              type="number"
              name="manual_discount"
              value={formData.manual_discount}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div>
            <Select
              label="Metode Pembayaran"
              name="payment_method"
              value={formData.payment_method}
              onChange={(value) => handleSelectChange('payment_method', value)}
              options={paymentMethodOptions}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" loading={isLoading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;