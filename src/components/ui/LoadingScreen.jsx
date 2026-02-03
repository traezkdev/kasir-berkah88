import React from 'react';
import Icon from '../AppIcon';

const LoadingScreen = ({ message = "Memuat data...", submessage = "Mohon tunggu sebentar" }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 dark:border-blue-900/30 animate-[spin_3s_linear_infinite]"></div>

                {/* Inner Pulsing Circle */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 animate-pulse flex items-center justify-center">
                    <Icon name="Loader2" className="text-white animate-spin-slow" size={32} />
                </div>

                {/* Decorative Blobs */}
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-400 animate-bounce delay-75"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-rose-400 animate-bounce delay-150"></div>
            </div>

            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                    {message}
                </h3>
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    {submessage}
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}} />
        </div>
    );
};

export default LoadingScreen;
