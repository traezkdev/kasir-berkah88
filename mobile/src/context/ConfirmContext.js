import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
    const [config, setConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
        confirmText: 'Ya',
        cancelText: 'Batal',
        type: 'primary'
    });

    const confirm = useCallback(({
        title,
        message,
        onConfirm,
        onCancel,
        confirmText = 'Ya',
        cancelText = 'Batal',
        type = 'primary'
    }) => {
        return new Promise((resolve) => {
            setConfig({
                visible: true,
                title,
                message,
                confirmText,
                cancelText,
                type,
                onConfirm: () => {
                    setConfig(prev => ({ ...prev, visible: false }));
                    if (onConfirm) onConfirm();
                    resolve(true);
                },
                onCancel: () => {
                    setConfig(prev => ({ ...prev, visible: false }));
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });
        });
    }, []);

    const contextValue = useMemo(() => ({ confirm }), [confirm]);

    return (
        <ConfirmContext.Provider value={contextValue}>
            {children}
            <ConfirmDialog
                {...config}
            />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export default ConfirmContext;
