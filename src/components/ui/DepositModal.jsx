import React, { useState } from 'react';
import Icon from '../AppIcon';
import PremiumModal from './PremiumModal';

const DepositModal = ({ isOpen, onClose, onSave, accountType }) => {
    // Standardize date to YYYY-MM-DDTHH:mm for datetime-local input
    const getNowFormatted = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 19);
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

    return (
        <PremiumModal
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Deposit"
            subtitle={`Top up saldo ${accountType === 'owner' ? 'Owner' : 'Lapak'}`}
            variant="blue"
        >
            <div className="space-y-6">
                <PremiumModal.Field label="Tanggal & Waktu" icon="Calendar" variant="blue">
                    <input
                        type="datetime-local"
                        id="date"
                        step="1"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:ring-4 focus:ring-[#118eea]/10 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono font-medium outline-none text-sm text-gray-700 dark:text-gray-200"
                        required
                    />
                </PremiumModal.Field>

                <PremiumModal.Field label="Jumlah Deposit (Rp)" icon="Wallet" variant="blue">
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(''); }}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:ring-4 focus:ring-[#118eea]/10 focus:bg-white dark:focus:bg-slate-800 transition-all font-black text-lg tracking-tight text-[#118eea] outline-none"
                        placeholder="0"
                        required
                    />
                </PremiumModal.Field>

                <PremiumModal.Field label="Deskripsi Tambahan" icon="AlignLeft" variant="blue">
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#118eea]/10 outline-none transition-all text-sm text-gray-700 dark:text-gray-200 font-medium min-h-[100px] resize-none"
                        placeholder="Misal: Dana pribadi, Penjualan tambahan"
                    ></textarea>
                </PremiumModal.Field>

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest border border-red-100 dark:border-red-500/20">
                        <Icon name="AlertCircle" size={16} />
                        {error}
                    </div>
                )}

                <PremiumModal.Actions
                    onCancel={onClose}
                    onConfirm={handleSave}
                    confirmText="Tambah"
                    variant="blue"
                />
            </div>
        </PremiumModal>
    );
};

export default DepositModal;
