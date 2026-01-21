import React from 'react';
import ExpenseEntryForm from './ExpenseEntryForm';
import Icon from '../../../components/AppIcon';

const AddExpenseModal = ({
    isOpen,
    onClose,
    onSave,
    isLoading,
    userRole,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end lg:items-center justify-center p-0 lg:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div
                className="relative w-full lg:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden
                   lg:mx-auto lg:h-[90vh]
                   fixed lg:relative bottom-0 left-0 right-0 h-[92vh] lg:h-auto
                   rounded-none animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sticky Header */}
                <div className="sticky top-0 right-0 p-6 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Icon name="Plus" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Catat Pengeluaran</h2>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Tambahkan detail biaya operasional</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-95"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-full pb-32">
                    <div className="p-6">
                        <ExpenseEntryForm
                            onAddExpense={async (data) => {
                                await onSave(data);
                                onClose();
                            }}
                            isLoading={isLoading}
                            userRole={userRole}
                            isInsideModal={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;
