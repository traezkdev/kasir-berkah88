import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import authFetch from '../../../utils/authFetch';

const PopupDisplay = () => {
    const [popups, setPopups] = useState([]);
    const [currentPopup, setCurrentPopup] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch active popups on mount
    useEffect(() => {
        fetchActivePopups();
    }, []);

    // Check for popups whenever location changes or popups array updates
    useEffect(() => {
        if (popups.length > 0) {
            checkAndShowPopup();
        }
    }, [location.pathname, popups]);

    const fetchActivePopups = async () => {
        try {
            const response = await authFetch('/api/popups/active');
            if (response.ok) {
                const result = await response.json();
                // Ensure result is an array
                const data = Array.isArray(result) ? result : (result.data || []);
                setPopups(data);
            }
        } catch (error) {
            console.error('Failed to fetch popups:', error);
        }
    };

    const checkAndShowPopup = () => {
        // Find suitable popups for current page
        const currentPath = location.pathname;

        // Filter popups that should show on this page
        const relevantPopups = popups.filter(popup => {
            // Check if user has seen and closed this popup in this session
            // BUT also check if it was pushed AGAIN after being seen
            const lastSeenTime = sessionStorage.getItem(`seen_popup_time_${popup.id}`);
            const lastPushedTime = popup.last_pushed_at ? new Date(popup.last_pushed_at).getTime() : 0;

            // If seen after the last push, don't show it again
            if (lastSeenTime && parseInt(lastSeenTime) > lastPushedTime) {
                return false;
            }

            // Page logic
            if (!popup.show_on_pages || popup.show_on_pages.length === 0) return true; // Show everywhere if empty

            // Map internal page keys to actual paths
            const pageMap = {
                'dashboard': '/customer/dashboard',
                'menu': '/customer/menu',
                'cart': '/customer/cart',
                'profile': '/customer/profile',
                'promo': '/customer/promo',
                'orders': '/customer/orders', // Assuming orders page exists or maps to cart/history
                'points': '/customer/points-history'
            };

            const isOnPage = popup.show_on_pages.some(page => {
                const targetPath = pageMap[page];
                if (!targetPath) return false;
                // Handle partial matches for nested routes like menu details
                if (page === 'menu' && currentPath.includes('/customer/menu')) return true;
                return currentPath === targetPath;
            });

            return isOnPage;
        });

        // Sort by priority (highest first), then by last pushed time (newest push first)
        relevantPopups.sort((a, b) => {
            if ((b.priority || 0) !== (a.priority || 0)) {
                return (b.priority || 0) - (a.priority || 0);
            }
            return (new Date(b.last_pushed_at || 0) - new Date(a.last_pushed_at || 0));
        });

        if (relevantPopups.length > 0) {
            setCurrentPopup(relevantPopups[0]);
            setIsVisible(true);
            // Track view
            trackView(relevantPopups[0].id);
        } else {
            setIsVisible(false);
            setCurrentPopup(null);
        }
    };

    const trackView = async (id) => {
        try {
            // Check if we tracked this view in this session to avoid spamming view count on page reload
            const tracked = sessionStorage.getItem(`tracked_view_${id}`);
            if (!tracked) {
                await authFetch(`/api/popups/${id}/view`, { method: 'POST' });
                sessionStorage.setItem(`tracked_view_${id}`, 'true');
            }
        } catch (err) {
            console.error('Error tracking view', err);
        }
    };

    const handleClose = () => {
        if (currentPopup) {
            // Mark as seen with TIMESTAMP
            sessionStorage.setItem(`seen_popup_time_${currentPopup.id}`, Date.now().toString());
            setIsVisible(false);
            setCurrentPopup(null);
        }
    };

    const handleAction = async () => {
        if (!currentPopup) return;

        // Track click
        try {
            await authFetch(`/api/popups/${currentPopup.id}/click`, { method: 'POST' });
        } catch (err) {
            console.error('Error tracking click', err);
        }

        handleClose(); // Close the popup first

        // Handle navigation
        const { link_type, link_value } = currentPopup;

        if (link_type === 'url' && link_value) {
            window.open(link_value, '_blank');
        } else if (link_type === 'screen' && link_value) {
            const screenMap = {
                'Promo': '/customer/promo',
                'Menu': '/customer/menu',
                'InformationScreen': '/customer/information'
            };
            const target = screenMap[link_value];
            if (target) navigate(target);
        }
    };

    if (!isVisible || !currentPopup) return null;

    const API_URL = import.meta.env.VITE_API_URL || '';
    // Handle image URL correctly regardless of leading slash
    const imageUrl = currentPopup.image_url
        ? `${API_URL}${currentPopup.image_url.startsWith('/') ? '' : '/'}${currentPopup.image_url}`
        : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Image */}
                {imageUrl && (
                    <div className="w-full relative bg-gray-100">
                        <img
                            src={imageUrl}
                            alt={currentPopup.title}
                            className="w-full h-auto block"
                        />
                    </div>
                )}

                {/* Content - Clean layout below image */}
                <div className="p-6 text-center bg-white relative z-10">
                    <h3 className="text-xl font-black mb-2 leading-tight text-slate-800">
                        {currentPopup.title}
                    </h3>

                    {imageUrl && (
                        <p className="text-xs text-slate-500 font-medium mb-4">
                            Ketuk tombol di bawah untuk info selengkapnya
                        </p>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleAction}
                        className="mt-2 w-full py-3.5 px-6 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {currentPopup.link_type === 'none' ? 'Tutup Popup' : 'Lihat Sekarang'}
                        {currentPopup.link_type !== 'none' && (
                            <ArrowRight size={18} strokeWidth={3} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupDisplay;
