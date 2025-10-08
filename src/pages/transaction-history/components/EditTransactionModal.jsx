import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const EditTransactionModal = ({ isOpen, onClose, transaction, onSave }) => {
    const [editedTransaction, setEditedTransaction] = useState(transaction);

    useEffect(() => {
        setEditedTransaction(transaction);
    }, [transaction]);

    if (!isOpen || !editedTransaction) return null;

    const handleChange = (e) => {
        // Check if the event is from a custom Select component (which passes value directly)
        if (typeof e === 'string') {
            setEditedTransaction(prev => ({
                ...prev,
                payment_method: e // e is the selected value from Select
            }));
        } else if (e && e.target) { // Standard event object from Input or Checkbox
            const { name, value, type, checked } = e.target;
            setEditedTransaction(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        } else if (typeof e === 'boolean') { // For Checkbox onCheckedChange if it passes boolean directly
            // This case is for the Checkbox component if it passes a boolean directly
            // Assuming it's for isEmployeeMeal based on previous context
            setEditedTransaction(prev => ({
                ...prev,
                isEmployeeMeal: e
            }));
        }
    };

    const handleSave = () => {
        onSave(editedTransaction);
    };

    const paymentMethodOptions = [
        { value: 'Tunai', label: 'Tunai' },
        { value: 'Gojek', label: 'Gojek' },
        { value: 'Transfer', label: 'Transfer' },
        { value: 'Makan Karyawan', label: 'Makan Karyawan' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Transaksi #{editedTransaction.id}</h2>
                <form>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="total">Total</label>
                        <Input
                            id="total"
                            name="total"
                            type="number"
                            value={editedTransaction.total}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ppn">PPN</label>
                        <Input
                            id="ppn"
                            name="ppn"
                            type="number"
                            step="0.01"
                            value={editedTransaction.ppn}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment_method">Metode Pembayaran</label>
                        <Select
                            id="payment_method"
                            name="payment_method"
                            value={editedTransaction.payment_method}
                            onChange={handleChange}
                            options={paymentMethodOptions}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                        </Select>
                    </div>
                    <div className="mb-4 flex items-center">
                        <Checkbox
                            id="isEmployeeMeal"
                            name="isEmployeeMeal"
                            checked={editedTransaction.isEmployeeMeal}
                            onChange={(e) => setEditedTransaction(prev => ({ ...prev, isEmployeeMeal: e.target.checked }))}
                            className="mr-2"
                        />
                        <label className="text-gray-700 text-sm font-bold" htmlFor="isEmployeeMeal">Makanan Karyawan</label>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Batal</Button>
                        <Button onClick={handleSave}>Simpan Perubahan</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
