import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import NotificationBell from './NotificationBell';

const AdminMobileHeader = ({
    title,
    subtitle,
    badgeText,
    onBack,
    actions = [],
    stickyTitle,
    showNotificationBell = true,
    decorativeIcon = "LayoutGrid",
    scrollThreshold = 100
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
        <div className="lg:hidden">
            {/* Sticky Header */}
            <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="px-6 flex items-center justify-between">
                    <button
                        onClick={handleDefaultBack}
                        className={`p-2 rounded-2xl transition-all active:scale-95 ${scrolled ? 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200' : 'bg-white/20 text-white backdrop-blur-md'}`}
                    >
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <div className={`text-center transition-all duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                        <h2 className="font-black text-gray-800 dark:text-white tracking-tight">
                            {stickyTitle || title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {showNotificationBell && (
                            <NotificationBell
                                size={20}
                                className={`${scrolled ? 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200' : 'bg-white/20 text-white backdrop-blur-md'}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-[#118eea] to-[#0d70ba] dark:from-slate-900 dark:to-slate-800 pt-20 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>

                {/* Decorative Background Icon */}
                <div className="absolute -right-12 -top-12 text-white/20 -rotate-12 pointer-events-none">
                    <Icon name={decorativeIcon} size={200} />
                </div>

                <div className="relative z-10">
                    <div>
                        {badgeText && (
                            <p className="text-[10px] font-black text-blue-100 dark:text-blue-200/60 uppercase tracking-[0.2em] mb-2 opacity-80">
                                {badgeText}
                            </p>
                        )}
                        <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                            {title}
                            {subtitle && <><br />{subtitle}</>}
                        </h1>
                    </div>
                </div>

                {actions.length > 0 && (
                    <div className="mt-8 flex gap-3 relative z-10">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-2 active:scale-95 transition-all outline-none"
                            >
                                <div className="bg-white/20 p-2 rounded-xl text-white">
                                    <Icon name={action.icon} size={18} />
                                </div>
                                <span className="font-black text-[11px] text-white uppercase tracking-tight leading-tight text-left">
                                    {action.label.includes(' ') ? (
                                        <>
                                            {action.label.split(' ')[0]}<br />{action.label.split(' ').slice(1).join(' ')}
                                        </>
                                    ) : action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMobileHeader;
