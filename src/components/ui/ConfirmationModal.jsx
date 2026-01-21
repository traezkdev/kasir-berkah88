import React from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya', cancelText = 'Batal', isDestructive = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <Icon name="X" className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-text-secondary mb-6 whitespace-pre-line">{message}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>{cancelText}</Button>
                    <Button variant={isDestructive ? "destructive" : "primary"} onClick={onConfirm}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;