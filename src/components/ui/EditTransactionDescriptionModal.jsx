import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import PremiumModal from './PremiumModal';

const EditTransactionDescriptionModal = ({ isOpen, onClose, onSave, transaction }) => {
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState('');

    // Synchronize local state with transaction prop when it changes or modal opens
    useEffect(() => {
        if (isOpen && transaction) {
            setAmount(transaction.amount || 0);
            setDescription(transaction.description || '');

            const dateVal = transaction.date || transaction.created_at;
            if (dateVal) {
                const d = new Date(dateVal);
                const pad = (n) => n.toString().padStart(2, '0');
                const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                setDate(formattedDate);
            } else {
                setDate('');
            }
            setError('');
        }
    }, [isOpen, transaction]);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const parseNumber = (str) => {
        if (!str) return 0;
        // Remove all non-digit characters for clean integer parsing (Standard for Rupiah)
        const cleaned = str.toString().replace(/[^\d]/g, '');
        return parseInt(cleaned, 10) || 0;
    };

    const handleSave = () => {
        if (!description.trim()) {
            setError('Deskripsi tidak boleh kosong');
            return;
        }
        if (amount <= 0) {
            setError('Nominal harus lebih dari 0');
            return;
        }
        if (!date) {
            setError('Tanggal harus diisi');
            return;
        }
        onSave(transaction.id, description, amount, date);
    };

    if (!transaction) return null;

    return (
        <PremiumModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Transaksi"
            subtitle="Sesuaikan detail catatan dana"
            variant="blue"
        >
            <div className="space-y-6">
                <PremiumModal.Field label="Tanggal & Waktu" icon="Calendar" variant="blue">
                    <input
                        type="datetime-local"
                        id="date"
                        step="1"
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setError(''); }}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:ring-4 focus:ring-[#118eea]/10 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono font-medium outline-none text-sm text-gray-700 dark:text-gray-200"
                        required
                    />
                </PremiumModal.Field>

                <PremiumModal.Field label="Nominal (Rp)" icon="Wallet" variant="blue">
                    <input
                        type="text"
                        id="amount"
                        value={`Rp${formatNumber(amount)}`}
                        onChange={(e) => {
                            const val = parseNumber(e.target.value);
                            setAmount(isNaN(val) ? 0 : val);
                            setError('');
                        }}
                        onFocus={(e) => {
                            const val = parseNumber(e.target.value);
                            e.target.value = val === 0 ? '' : val.toString();
                        }}
                        onBlur={(e) => {
                            const val = parseNumber(e.target.value);
                            setAmount(val);
                            e.target.value = `Rp${formatNumber(val)}`;
                        }}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:ring-4 focus:ring-[#118eea]/10 focus:bg-white dark:focus:bg-slate-800 transition-all font-black text-lg tracking-tight text-[#118eea] outline-none"
                        required
                    />
                </PremiumModal.Field>

                <PremiumModal.Field label="Deskripsi Catatan" icon="AlignLeft" variant="blue">
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => { setDescription(e.target.value); setError(''); }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 focus:border-[#118eea] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#118eea]/10 outline-none transition-all text-sm text-gray-700 dark:text-gray-200 font-medium min-h-[100px] resize-none"
                        placeholder="Masukkan deskripsi transaksi"
                        required
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
                    confirmText="Simpan"
                    variant="blue"
                />
            </div>
        </PremiumModal>
    );
};

export default EditTransactionDescriptionModal;
