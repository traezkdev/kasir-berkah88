import React from 'react';
import Icon from '../AppIcon';

/**
 * CardTemplate1 - Komponen UI Card Premium Gaya Native
 * 
 * Props:
 * - title: string (Judul utama)
 * - description: string (Deskripsi singkat)
 * - icon: string (Nama ikon Lucide)
 * - onClick: function (Aksi saat kartu diklik)
 * - color: 'primary' | 'success' | 'accent' | 'secondary' | 'destructive'
 * - badgeText: string (Teks badge kecil di header, default: 'Quick Action')
 * - footerText: string (Teks tombol bawah, default: 'Akses Sekarang')
 * - disabled: boolean (Status non-aktif)
 */
const CardTemplate1 = ({
    title,
    description,
    icon,
    onClick,
    color = 'primary',
    badgeText = 'Quick Action',
    footerText = 'Akses Sekarang',
    disabled = false
}) => {
    const colorStyles = {
        primary: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/20',
        success: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20',
        accent: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/20',
        secondary: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/20',
        destructive: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/20'
    };

    const activeStyle = colorStyles[color] || colorStyles.primary;

    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onClick && onClick()}
        >
            {/* Subtle Background Icon Decor */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white`}>
                <Icon name={icon} size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-5">
                    <div className={`p-3.5 rounded-2xl shadow-inner border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${activeStyle}`}>
                        <Icon name={icon} size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight mb-1">{title}</h3>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-block ${activeStyle}`}>
                            {badgeText}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed">
                    {description}
                </p>

                <div className="mt-auto flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${color === 'destructive' ? 'text-rose-500' : 'text-primary'}`}>
                        {footerText}
                    </span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:translate-x-1 ${activeStyle} shadow-sm border`}>
                        <Icon name="ArrowRight" size={14} strokeWidth={3} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardTemplate1;
