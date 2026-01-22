import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiX, FiArrowRight, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NewOrderPopup = ({ isOpen, onClose, orderData, userRole }) => {
    const navigate = useNavigate();

    if (!orderData) return null;

    const handleViewDetails = () => {
        // Navigasi berdasarkan role
        if (userRole === 'penjual') {
            navigate('/seller/orders');
        } else {
            navigate('/order-confirmation');
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="fixed bottom-24 left-1/2 z-[9999] w-[90%] max-w-md"
                >
                    <div className="relative overflow-hidden rounded-3xl border-2 border-[#128EEA] bg-white/90 p-5 shadow-[0_20px_50px_rgba(18,142,234,0.3)] backdrop-blur-xl dark:border-blue-500 dark:bg-gray-900/90">
                        {/* Animated Background Pulse */}
                        <div className="absolute -left-10 -top-10 h-32 w-32 animate-pulse rounded-full bg-blue-500/10 blur-3xl"></div>
                        <div className="absolute -right-10 -bottom-10 h-32 w-32 animate-pulse rounded-full bg-purple-500/10 blur-3xl"></div>

                        <div className="relative flex flex-col gap-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
                                        <FiBell className="animate-bounce text-xl text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                                            Pesanan Baru!
                                        </h4>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Baru saja masuk
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            {/* Content Widget */}
                            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:from-blue-900/20 dark:to-blue-800/10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">
                                            Nama Pelanggan
                                        </span>
                                        <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                                            {orderData.customer_name || 'Pelanggan'}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">
                                            Total Bayar
                                        </span>
                                        <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                                            Rp {orderData.total?.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleViewDetails}
                                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#128EEA] py-3 text-sm font-black text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                            >
                                <FiShoppingBag />
                                CEK PESANAN
                                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewOrderPopup;
