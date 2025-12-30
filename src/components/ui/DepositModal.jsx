import React, { useState } from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const DepositModal = ({ isOpen, onClose, onSave, accountType }) => {
    // Standardize date to YYYY-MM-DDTHH:mm for datetime-local input
    const getNowFormatted = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(getNowFormatted());
    const [error, setError] = useState('');

    const handleSave = () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Jumlah harus angka positif.');
            return;
        }
        onSave(parsedAmount, description, date);
        setAmount('');
        setDescription('');
        setDate(getNowFormatted());
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Tambah Deposit {accountType === 'owner' ? 'Owner' : 'Lapak'}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <Icon name="X" className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Tanggal & Waktu</label>
                        <input
                            type="datetime-local"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Jumlah</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(''); }}
                            className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-primary focus:border-primary"
                            placeholder="Contoh: 100000"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Deskripsi (Opsional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-primary focus:border-primary"
                            rows="3"
                            placeholder="Misal: Dana pribadi, Penjualan tambahan"
                        ></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Batal</Button>
                        <Button onClick={handleSave}>Tambah Deposit</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositModal;
