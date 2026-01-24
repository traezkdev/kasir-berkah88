import React from 'react';
import Icon from '../AppIcon';

/**
 * CardTemplate2 - Komponen UI Metrics Card Premium Gaya Native
 * 
 * Props:
 * - title: string (Label metrik)
 * - value: string | number (Nilai utama, mendukung format Rp)
 * - icon: string (Nama ikon Lucide)
 * - description: string (Penjelasan singkat di bawah nilai)
 * - color: 'primary' | 'success' | 'warning' | 'accent' | 'info' | 'destructive' | 'white'
 * - trend: { type: 'up' | 'down' | 'neutral', value: string } (Data tren, opsional)
 * - badgeText: string (Teks badge kecil di header, default: 'OVR')
 */
const CardTemplate2 = ({
    title,
    value,
    icon,
    description,
    color = 'primary',
    trend = null,
    badgeText = 'OVR'
}) => {
    const glowColors = {
        primary: 'bg-blue-400',
        success: 'bg-emerald-400',
        warning: 'bg-amber-400',
        accent: 'bg-pink-400',
        info: 'bg-indigo-400',
        destructive: 'bg-rose-400',
        white: 'bg-slate-200'
    };

    const iconColors = {
        primary: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30',
        success: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30',
        warning: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30',
        accent: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800/30',
        info: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30',
        destructive: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30',
        white: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700',
    };

    const activeGlow = glowColors[color] || glowColors.primary;
    const activeIcon = iconColors[color] || iconColors.primary;

    const renderValue = (val) => {
        if (typeof val === 'string' && val.includes('Rp')) {
            const parts = val.split(' ');
            if (parts.length >= 2) {
                return (
                    <>
                        <span className="text-sm lg:text-[11px] font-bold opacity-70 mr-1">{parts[0]}</span>
                        <span>{parts[1]}</span>
                    </>
                );
            }
        }
        return val;
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-5 transition-all duration-300 h-full relative overflow-hidden group shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1`}>
            {/* Background Glow Effect */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none ${activeGlow}`}></div>

            {/* Subtle Background Icon Decor */}
            <div className={`absolute -left-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white`}>
                <Icon name={icon} size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Top Section: Icon & Trend */}
                <div className="flex items-start justify-between mb-6 lg:mb-4">
                    <div className={`p-3.5 lg:p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner border flex items-center justify-center ${activeIcon}`}>
                        <Icon name={icon} size={22} lg:size={18} strokeWidth={2.5} />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${activeIcon}`}>
                            {badgeText}
                        </div>
                        {trend && (
                            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 text-gray-500 dark:text-gray-300 shadow-sm">
                                <Icon
                                    name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                                    size={10}
                                    strokeWidth={3}
                                />
                                <span>{trend?.value}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400 dark:text-slate-500 leading-none">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-2 lg:mb-1">
                        <p className="text-2xl lg:text-xl font-black tracking-tighter leading-none text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-left truncate">
                            {renderValue(value)}
                        </p>
                    </div>
                    {description && (
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 line-clamp-1 opacity-80 leading-tight">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardTemplate2;
