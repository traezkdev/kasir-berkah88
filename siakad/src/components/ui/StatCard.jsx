import React from 'react';

const getColorClasses = (colorName) => {
    const colorMap = {
        'blue': {
            icon: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30',
            blob: 'bg-blue-400',
            text: 'text-blue-600'
        },
        'indigo': {
            icon: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30',
            blob: 'bg-indigo-400',
            text: 'text-indigo-600'
        },
        'purple': {
            icon: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/30',
            blob: 'bg-purple-400',
            text: 'text-purple-600'
        },
        'pink': {
            icon: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800/30',
            blob: 'bg-pink-400',
            text: 'text-pink-600'
        },
        'emerald': {
            icon: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30',
            blob: 'bg-emerald-400',
            text: 'text-emerald-600'
        },
        'amber': {
            icon: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30',
            blob: 'bg-amber-400',
            text: 'text-amber-600'
        }
    };

    return colorMap[colorName] || colorMap['blue'];
};

/**
 * Premium StatCard Component
 * Inspired by Kasir Berkah 88 MetricsCard
 */
const StatCard = ({ title, value, icon: Icon, color = 'blue', trend, description, badgeText = 'SIAKAD' }) => {
    // Handle both 'bg-blue-500' format and just 'blue'
    const colorKey = color.includes('-') ? color.split('-')[1] : color;
    const classes = getColorClasses(colorKey);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-5 transition-all duration-300 h-full relative overflow-hidden group shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
            {/* Background Decorations */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none gpu-acceleration ${classes.blob}`}></div>
            <div className="absolute -left-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white gpu-acceleration">
                <Icon size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6 lg:mb-4">
                    {/* Icon Container */}
                    <div className={`p-3.5 lg:p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner border flex items-center justify-center ${classes.icon}`}>
                        <Icon size={22} className="lg:size-[18px]" />
                    </div>

                    {/* Badge */}
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${classes.icon}`}>
                            {badgeText}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400 dark:text-slate-500 leading-none">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-2 lg:mb-1">
                        <p className="text-2xl lg:text-xl font-black tracking-tighter leading-none text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-left truncate">
                            {value}
                        </p>
                        {trend && (
                            <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 line-clamp-1 opacity-80 leading-tight">
                        {description || `Total data ${title.toLowerCase()} dalam sistem.`}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
