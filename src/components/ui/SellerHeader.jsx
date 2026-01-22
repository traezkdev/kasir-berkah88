import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const SellerHeader = ({
    title,
    subtitle,
    badgeText,
    onBack,
    rightContent,
    stickyTitle,
    stickyRightContent,
    showAdminButton = true,
    scrollThreshold = 20
}) => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > scrollThreshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrollThreshold]);

    const handleDefaultBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <>
            {/* Fixed Sticky Header (Mobile Only) */}
            <div className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 overflow-hidden lg:hidden ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`} style={{ maxWidth: '100vw' }}>
                <div className="px-6 flex items-center justify-between max-w-full">
                    <button
                        onClick={handleDefaultBack}
                        className={`p-2 rounded-xl flex-shrink-0 active:scale-95 transition-all ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}
                    >
                        <Icon name="ChevronLeft" size={24} />
                    </button>

                    <span className={`font-black tracking-tight flex-1 text-center transition-all ${scrolled ? 'text-gray-800' : 'text-white text-lg'}`}>
                        {stickyTitle || title}
                    </span>

                    <div className="flex gap-2">
                        {showAdminButton && (
                            <button
                                onClick={() => navigate('/main-dashboard')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 border ${scrolled ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white/20 text-white border-white/30'}`}
                            >
                                <Icon name="ArrowLeft" size={14} />
                                Admin
                            </button>
                        )}
                        {typeof stickyRightContent === 'function' ? stickyRightContent(scrolled) : stickyRightContent}
                    </div>
                </div>
            </div>

            {/* Main Header Section */}
            <header className="bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-600 pt-16 pb-10 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={handleDefaultBack}
                                className="hidden lg:flex p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all mr-2"
                            >
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            {badgeText && (
                                <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                                    {badgeText}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
                        {subtitle && <p className="text-blue-100/80 font-medium mt-1">{subtitle}</p>}
                    </div>

                    {rightContent}
                </div>
            </header>
        </>
    );
};

export default SellerHeader;
