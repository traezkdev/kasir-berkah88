import React from 'react';
import Button from './Button';
import Icon from '../AppIcon';

/**
 * PremiumModal - A unified template for high-end dashboard modals.
 * 
 * Props:
 * @param {boolean} isOpen - Control visibility
 * @param {function} onClose - Function to call on close/backdrop click
 * @param {string} title - Main header text (uppercase tracking-tighter)
 * @param {string} subtitle - Small description text under title
 * @param {string} variant - 'blue' | 'rose' | 'emerald' | 'amber' (default: 'blue')
 * @param {ReactNode} children - The form content area
 */
const PremiumModal = ({ isOpen, onClose, title, subtitle, variant = 'blue', children }) => {
    if (!isOpen) return null;

    const gradients = {
        blue: 'from-[#118eea] to-[#0d70ba]',
        rose: 'from-rose-500 to-rose-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
    };

    const textVariants = {
        blue: 'text-[#118eea]',
        rose: 'text-rose-500',
        emerald: 'text-emerald-500',
        amber: 'text-amber-500',
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all shadow-2xl">

                {/* Header Banner */}
                <div className={`bg-gradient-to-br ${gradients[variant] || gradients.blue} p-8 pb-10 relative overflow-hidden`}>
                    {/* Decorative Background Elements */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl opacity-20"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                <span className="w-4 h-[1px] bg-white/50"></span>
                                {subtitle}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 backdrop-blur-md"
                        >
                            <Icon name="X" size={20} />
                        </Button>
                    </div>
                </div>

                <div className="p-8 pt-6 bg-white dark:bg-slate-900 relative z-20">
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * PremiumModal.Field - Standardized input field layout with icon support.
 */
PremiumModal.Field = ({ label, icon, children, variant = 'blue' }) => {
    const focusColors = {
        blue: 'group-focus-within:text-[#118eea]',
        rose: 'group-focus-within:text-rose-500',
        emerald: 'group-focus-within:text-emerald-500',
        amber: 'group-focus-within:text-amber-500',
    };

    return (
        <div className="group mb-6 last:mb-0">
            <label className={`block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 transition-colors ${focusColors[variant] || focusColors.blue}`}>
                {label}
            </label>
            <div className="relative">
                {children}
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${focusColors[variant] || focusColors.blue}`}>
                        <Icon name={icon} size={18} />
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * PremiumModal.Actions - Standardized footer buttons for modals.
 */
PremiumModal.Actions = ({ onCancel, onConfirm, cancelText = 'Batal', confirmText = 'Simpan', variant = 'blue', isSubmitting = false }) => {
    const confirmGrades = {
        blue: 'from-[#118eea] to-[#0d70ba]',
        rose: 'from-rose-500 to-rose-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
    };

    return (
        <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-14 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700"
            >
                {cancelText}
            </Button>
            <Button
                onClick={onConfirm}
                disabled={isSubmitting}
                className={`h-14 rounded-2xl bg-gradient-to-r ${confirmGrades[variant] || confirmGrades.blue} text-white font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-50`}
            >
                {isSubmitting ? 'Memproses...' : confirmText}
            </Button>
        </div>
    );
};

export default PremiumModal;
