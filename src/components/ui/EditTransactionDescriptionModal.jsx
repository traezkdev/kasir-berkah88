import React, { useState, useEffect } from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const EditTransactionDescriptionModal = ({ isOpen, onClose, onSave, transaction }) => {
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && transaction) {
            setDescription(transaction.description || '');
            setError('');
        }
    }, [isOpen, transaction]);

    const handleSave = () => {
        if (!description.trim()) {
            setError('Deskripsi tidak boleh kosong.');
            return;
        }
        onSave(transaction.id, description);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Edit Deskripsi Transaksi</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <Icon name="X" className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
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
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Batal</Button>
                        <Button onClick={handleSave}>Simpan Perubahan</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTransactionDescriptionModal;
