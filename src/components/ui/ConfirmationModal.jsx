import React from 'react';
import Button from './Button'; // Assuming Button is in the same directory
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'confirm' // new prop: 'confirm', 'success', 'error'
}) => {
    if (!isOpen) return null;

    let iconComponent;
    let iconBgClass;
    let iconColorClass;
    let confirmButtonVariant;
    let confirmButtonText;

    switch (type) {
        case 'success':
            iconComponent = <Check size={24} />;
            iconBgClass = 'bg-green-100';
            iconColorClass = 'text-green-600';
            confirmButtonVariant = 'success';
            confirmButtonText = 'OK';
            break;
        case 'error':
            iconComponent = <X size={24} />;
            iconBgClass = 'bg-red-100';
            iconColorClass = 'text-red-600';
            confirmButtonVariant = 'destructive';
            confirmButtonText = 'Tutup';
            break;
        case 'confirm':
        default:
            iconComponent = <AlertTriangle size={24} />;
            iconBgClass = 'bg-blue-100';
            iconColorClass = 'text-blue-600';
            confirmButtonVariant = 'default';
            confirmButtonText = confirmText;
            break;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
            onClick={onClose}
        >
                        <div 
                            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 text-center" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBgClass} sm:h-10 sm:w-10">
                                {iconComponent}
                            </div>
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 flex w-full justify-center gap-3">                    <Button
                        variant={confirmButtonVariant}
                        onClick={type === 'confirm' ? onConfirm : onClose} // For success/error, just close
                    >
                        {confirmButtonText}
                    </Button>
                    {type === 'confirm' && (
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            {cancelText}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ConfirmationModal;
