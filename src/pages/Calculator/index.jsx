import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';

const CalculatorPage = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const displayRef = useRef(null);
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const [history, setHistory] = useState([]);

    // Auto scroll to bottom when expression or result changes
    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollTo({
                top: displayRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [expression, result, history]);

    const formatRupiah = (angka) => {
        if (!angka || angka === 'Error') return '';
        const num = parseFloat(angka);
        if (isNaN(num)) return angka;
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const handleButtonClick = (value) => {
        // Haptic feedback if available
        if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }

        if (value === '=') {
            try {
                // Sanitize and evaluate
                const sanitizedExpr = expression.replace(/,/g, '');
                if (!sanitizedExpr) return;

                // Use a safer eval or math logic
                const calculatedResult = eval(sanitizedExpr).toString();
                setResult(calculatedResult);

                // Add to history
                setHistory(prev => [{
                    expr: expression,
                    res: calculatedResult
                }, ...prev].slice(0, 5));

                setExpression(calculatedResult);
            } catch (error) {
                setResult('Error');
            }
        } else if (value === 'C') {
            setExpression('');
            setResult('');
        } else if (value === '⌫') {
            setExpression(prev => prev.slice(0, -1));
        } else {
            // Prevent multiple dots or operators
            const lastChar = expression.slice(-1);
            const operators = ['+', '-', '*', '/'];
            if (operators.includes(value) && operators.includes(lastChar)) {
                setExpression(prev => prev.slice(0, -1) + value);
            } else {
                setExpression(prev => prev + value);
            }
        }
    };

    const buttons = [
        { label: 'C', type: 'action', color: 'rose' },
        { label: '(', type: 'operator', color: 'indigo' },
        { label: ')', type: 'operator', color: 'indigo' },
        { label: '/', type: 'operator', color: 'indigo' },
        { label: '7', type: 'num' },
        { label: '8', type: 'num' },
        { label: '9', type: 'num' },
        { label: '*', type: 'operator', color: 'indigo' },
        { label: '4', type: 'num' },
        { label: '5', type: 'num' },
        { label: '6', type: 'num' },
        { label: '-', type: 'operator', color: 'indigo' },
        { label: '1', type: 'num' },
        { label: '2', type: 'num' },
        { label: '3', type: 'num' },
        { label: '+', type: 'operator', color: 'indigo' },
        { label: '0', type: 'num' },
        { label: '.', type: 'num' },
        { label: '⌫', type: 'action', color: 'amber' },
        { label: '=', type: 'equals', color: 'blue' },
    ];

    const getBtnClass = (btn) => {
        const base = "h-16 lg:h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all active:scale-90 select-none ";
        if (btn.type === 'num') {
            return base + "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50";
        }
        if (btn.type === 'operator') {
            return base + "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100";
        }
        if (btn.type === 'action') {
            if (btn.color === 'rose') return base + "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100";
            if (btn.color === 'amber') return base + "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100";
        }
        if (btn.type === 'equals') {
            return base + "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700";
        }
        return base;
    };

    return (
        <div className={`fixed inset-0 overflow-hidden min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'} lg:pb-12 lg:relative lg:overflow-visible`}>
            {theme === 'default' && <NavigationHeader headerTitle="Kalkulator Kasir" />}

            <main className={`max-w-7xl mx-auto flex flex-col h-full lg:h-auto ${theme === 'default' ? 'lg:px-6 pt-20 lg:pt-24' : 'p-0'}`}>
                {/* Desktop Breadcrumb */}
                <div className="hidden lg:block mb-8">
                    <BreadcrumbNavigation customPath={[{ label: 'Alat', path: '/all-features' }, { label: 'Kalkulator', path: '/calculator', isActive: true }]} />
                </div>

                {/* Calculator Container */}
                <div className="flex-1 lg:flex-none flex flex-col lg:flex-row items-stretch justify-center gap-0 lg:gap-8 pb-20 lg:pb-0 min-h-0 overflow-hidden lg:max-w-6xl lg:mx-auto w-full lg:px-0">

                    {/* Display Section */}
                    <div className="w-full lg:w-1/2 flex flex-col flex-none min-h-0">
                        <div className="bg-white dark:bg-gray-900 p-6 lg:p-12 lg:rounded-[3rem] flex-none flex flex-col justify-end lg:justify-start text-right shadow-xl shadow-indigo-500/5 border-b lg:border border-gray-100 dark:border-gray-800 relative overflow-hidden h-48 lg:h-[600px] flex-shrink-0 transition-all duration-500">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                            {/* Scroll Area inside Display */}
                            <div ref={displayRef} className="overflow-y-auto lg:overflow-hidden h-full pr-1 custom-scrollbar relative z-10 flex flex-col">
                                <div className="mt-auto">
                                    {/* History */}
                                    <div className="mb-4 lg:mb-10 space-y-2 opacity-40">
                                        {history.map((h, i) => (
                                            <p key={i} className="text-[10px] lg:text-base font-bold text-gray-500 italic hover:opacity-100 transition-opacity">
                                                {formatRupiah(h.expr)} = {formatRupiah(h.res)}
                                            </p>
                                        ))}
                                    </div>

                                    <div className="space-y-1 lg:space-y-6">
                                        <p className="text-[10px] lg:text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 opacity-70">Sistem Kalkulasi</p>
                                        <div className="text-xl lg:text-4xl font-bold text-gray-400 tracking-tight break-all min-h-[1.5rem] lg:min-h-[4rem] leading-tight">
                                            {expression || '0'}
                                        </div>
                                        <div className="text-4xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter break-all hover:scale-[1.02] transition-transform origin-right">
                                            {formatRupiah(result) || formatRupiah(expression) || '0'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Header Overlays */}
                        <div className="lg:hidden absolute top-4 left-4 flex gap-2">
                            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 border border-white">
                                <Icon name="ArrowLeft" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Keypad Section */}
                    <div className="w-full lg:w-1/2 bg-white/60 lg:bg-white dark:bg-gray-900 p-4 lg:p-12 lg:rounded-[3rem] lg:shadow-xl lg:shadow-indigo-500/5 lg:border border-gray-100 dark:border-gray-800 flex-1 overflow-y-auto lg:overflow-visible lg:h-[600px] flex flex-col justify-between">
                        <div className="grid grid-cols-4 gap-3 lg:gap-4 flex-1">
                            {buttons.map((btn, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleButtonClick(btn.label)}
                                    className={getBtnClass(btn)}
                                >
                                    {btn.label === '⌫' ? <Icon name="Delete" size={24} /> : btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Quick Actions (e.g. for cashier) */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setExpression('');
                                    setResult('');
                                    setHistory([]);
                                }}
                                className="py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                            >
                                Reset Riwayat
                            </button>
                            <button
                                onClick={() => {
                                    if (result) {
                                        navigator.clipboard.writeText(result);
                                        toast.success("Hasil disalin!");
                                    }
                                }}
                                className="py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                            >
                                Salin Hasil
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CalculatorPage;

