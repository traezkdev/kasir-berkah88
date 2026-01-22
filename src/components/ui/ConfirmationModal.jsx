import React from 'react';
import PremiumModal from './PremiumModal';
import Icon from '../AppIcon';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya', cancelText = 'Batal', isDestructive = true }) => {
    return (
        <PremiumModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle="Konfirmasi Tindakan"
            variant={isDestructive ? 'rose' : 'blue'}
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center py-4">
                    <div className={`p-4 rounded-full ${isDestructive ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'} mb-4 scale-125`}>
                        <Icon name={isDestructive ? "AlertTriangle" : "HelpCircle"} size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed max-w-[280px]">
                        {message}
                    </p>
                </div>

                <PremiumModal.Actions
                    onCancel={onClose}
                    onConfirm={onConfirm}
                    cancelText={cancelText}
                    confirmText={confirmText}
                    variant={isDestructive ? 'rose' : 'blue'}
                />
            </div>
        </PremiumModal>
    );
};

export default ConfirmationModal;