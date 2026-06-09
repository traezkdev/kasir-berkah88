import React, { useState, useEffect, useCallback, memo } from 'react';
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
    rightIcon,
    onRightAction,
    decorativeIcon = "LayoutGrid",
    scrollThreshold = 100
}) => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const scrollThresholdValue = scrollThreshold;

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrolled = window.scrollY > scrollThresholdValue;
                    if (scrolled !== currentScrolled) {
                        setScrolled(currentScrolled);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled, scrollThresholdValue]);

    const handleDefaultBack = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    }, [onBack, navigate]);

    return (
        <div className="lg:hidden">
            {/* Sticky Header */}
            <div
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'shadow-sm py-3 bg-[#138FEA]' : 'bg-transparent py-5'}`}
            >
                <div className="px-6 flex items-center justify-between">
                    <button
                        onClick={handleDefaultBack}
                        className={`p-2 rounded-2xl transition-[transform,background-color] active:scale-95 ${scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white'}`}
                    >
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <div className={`text-center transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                        <h2 className="font-black text-white tracking-tight">
                            {stickyTitle || title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {rightIcon ? (
                            <button
                                onClick={onRightAction}
                                className={`p-2 rounded-full transition-all active:scale-95 ${scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-sm'}`}
                            >
                                <Icon name={rightIcon} size={20} />
                            </button>
                        ) : (
                            showNotificationBell && (
                                <NotificationBell
                                    size={20}
                                    className={`${scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-sm'}`}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-[#118eea] to-[#0d70ba] dark:from-slate-900 dark:to-slate-800 pt-20 pb-28 px-6 relative overflow-hidden">
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
                    <div className="mt-8 flex flex-wrap gap-3 relative z-10">
                        {actions.map((action, index) => {
                            const isSuccess = action.color === 'success';
                            const isDanger = action.color === 'danger' || action.color === 'destructive';

                            const buttonClass = isSuccess
                                ? "bg-emerald-500/40 border-emerald-400/50 shadow-[0_8px_32px_rgba(16,185,129,0.15)]"
                                : isDanger
                                    ? "bg-rose-500/40 border-rose-400/50 shadow-[0_8px_32px_rgba(244,63,94,0.15)]"
                                    : "bg-white/20 border-white/30";

                            const iconBoxClass = isSuccess
                                ? "bg-emerald-400/50 text-white"
                                : isDanger
                                    ? "bg-rose-400/50 text-white"
                                    : "bg-white/30 text-white";

                            return (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={`flex-1 backdrop-blur-sm p-3.5 rounded-2xl border flex items-center gap-2.5 active:scale-95 transition-all outline-none ${buttonClass}`}
                                >
                                    <div className={`p-2 rounded-xl scale-110 ${iconBoxClass}`}>
                                        <Icon name={action.icon} size={18} strokeWidth={3} />
                                    </div>
                                    <span className="font-black text-[12px] text-white uppercase tracking-wide leading-tight text-left drop-shadow-sm">
                                        {action.label.includes(' ') ? (
                                            <>
                                                {action.label.split(' ')[0]}<br />{action.label.split(' ').slice(1).join(' ')}
                                            </>
                                        ) : action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(AdminMobileHeader);
