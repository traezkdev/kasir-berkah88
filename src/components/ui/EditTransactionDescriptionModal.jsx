import React, { useState, useEffect } from 'react';
import Button from './Button';
import Icon from '../AppIcon';
import Input from './Input';

const EditTransactionDescriptionModal = ({ isOpen, onClose, onSave, transaction }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && transaction) {
            setDescription(transaction.description || '');
            setAmount(transaction.amount || 0);
            setError('');
        }
    }, [isOpen, transaction]);

    const handleSave = () => {
        if (!description.trim()) {
            setError('Deskripsi tidak boleh kosong.');
            return;
        }
        if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
            setError('Nominal harus berupa angka yang valid.');
            return;
        }
        onSave(transaction.id, description, parseFloat(amount));
    };

    const formatNumber = (num) => {
        return num.toLocaleString('id-ID');
    };

    const parseNumber = (str) => {
        const cleanedStr = str.replace(/[^,\d]/g, '').replace(/,/g, '.');
        return parseFloat(cleanedStr);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Edit Transaksi</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <Icon name="X" className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Nominal (Rp)</label>
                        <Input
                            id="amount"
                            type="text"
                            value={`Rp${formatNumber(amount)}`}
                            onChange={(e) => {
                                const val = parseNumber(e.target.value);
                                setAmount(isNaN(val) ? 0 : val);
                                setError('');
                            }}
                            onFocus={(e) => {
                                e.target.value = parseNumber(e.target.value).toString();
                            }}
                            onBlur={(e) => {
                                const value = parseNumber(e.target.value);
                                e.target.value = `Rp${formatNumber(isNaN(value) ? 0 : value)}`;
                            }}
                            placeholder="Masukkan nominal"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Deskripsi</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setError(''); }}
                            className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-primary focus:border-primary"
                            rows="3"
                            placeholder="Masukkan deskripsi transaksi"
                            required
                        ></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose}>Batal</Button>
                        <Button onClick={handleSave}>Simpan Perubahan</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTransactionDescriptionModal;
