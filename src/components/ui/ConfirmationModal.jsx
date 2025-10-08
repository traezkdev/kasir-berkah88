import React from 'react';
import Button from './Button'; // Assuming Button is in the same directory
import { Check, X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Ya, Lanjutkan', 
    cancelText = 'Batal',
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start space-x-4">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                        <AlertTriangle className={`${isDestructive ? 'text-red-600' : 'text-blue-600'}`} size={24} />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-grow">
                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button 
                        variant={isDestructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
