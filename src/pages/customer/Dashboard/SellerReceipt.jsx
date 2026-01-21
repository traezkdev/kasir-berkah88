import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Share2, ArrowLeft, Download, Printer, Copy } from 'lucide-react';
import Icon from '../../../components/AppIcon';
import * as htmlToImage from 'html-to-image';
import toast from 'react-hot-toast';

const apiUrl = import.meta.env.VITE_API_URL;

const SellerReceipt = () => {
    const receiptRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { transaction } = location.state || {}; // Expect transaction data here

    const [restaurantName, setRestaurantName] = useState('Trz Kasir Apps');
    const [restaurantSlogan, setRestaurantSlogan] = useState('Aplikasi kasir modern cepat dan keren');
    const [restaurantUrl, setRestaurantUrl] = useState('www.berkah88.id');
    const [logoUrl, setLogoUrl] = useState('');
    const [receiptVersion, setReceiptVersion] = useState('1');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRestaurantSettings = async () => {
            try {
                const [resSettings, logoRes, versionRes] = await Promise.all([
                    fetch(`${apiUrl}/api/restaurant-settings`),
                    fetch(`${apiUrl}/api/settings/logo`),
                    fetch(`${apiUrl}/api/settings/receipt_version`)
                ]);

                const data = await resSettings.json();
                if (resSettings.ok && data.data) {
                    setRestaurantName(data.data.restaurant_name || 'Trz Kasir Apps');
                    setRestaurantSlogan(data.data.restaurant_slogan || 'Aplikasi kasir modern cepat dan keren');
                    setRestaurantUrl(data.data.restaurant_url || 'www.berkah88.id');
                }

                const logoData = await logoRes.json();
                if (logoRes.ok && logoData.data?.logo_url) {
                    const fullUrl = logoData.data.logo_url.startsWith('/public')
                        ? `${apiUrl}${logoData.data.logo_url}`
                        : logoData.data.logo_url;

                    // Convert to base64 to avoid CORS issues during html-to-image conversion
                    try {
                        const response = await fetch(fullUrl);
                        if (response.ok) {
                            const blob = await response.blob();
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setLogoUrl(reader.result);
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            // If file not found or other error, clear logoUrl to use fallback
                            setLogoUrl('');
                        }
                    } catch (e) {
                        console.error("Failed to convert logo to base64", e);
                        setLogoUrl(fullUrl);
                    }
                }

                const versionData = await versionRes.json();
                if (versionRes.ok && versionData.data?.value) {
                    setReceiptVersion(versionData.data.value);
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };

        fetchRestaurantSettings();
    }, []);

    if (!transaction) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6">
                <div className="bg-red-50 p-6 rounded-full mb-4 animate-bounce">
                    <Icon name="AlertCircle" className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-gray-800 mb-2">Data Transaksi Hilang</h2>
                <p className="text-gray-500 mb-6">Sepertinya Anda mengakses halaman ini secara langsung.</p>
                <button
                    onClick={() => navigate('/seller/transaction-history')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const handleWhatsAppShare = () => {
        const transactionDateStr = new Date(transaction.timestamp).toLocaleString("id-ID", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });

        // Basic Text Construction (Simplified for Seller quick share)
        let message = `*${restaurantName.toUpperCase()}*\n`;
        message += `${restaurantSlogan}\n`;
        message += `--------------------------\n`;
        message += `*ID:* ${transaction.id}\n`;
        message += `*Tgl:* ${transactionDateStr}\n`;
        message += `--------------------------\n`;
        message += `*Ringkasan Item:*\n`;
        transaction.items.forEach(item => {
            message += `- ${item.name} (${item.quantity}x)\n`;
        });
        message += `--------------------------\n`;
        message += `*TOTAL: Rp ${Number(transaction.total).toLocaleString("id-ID")}*\n`;
        message += `Metode: ${transaction.payment_method}\n`;
        message += `\nTerima kasih!`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
    };

    const handleDownload = async () => {
        if (!receiptRef.current || isLoading) return;
        setIsLoading(true);
        const toastId = toast.loading('Memproses gambar...');

        try {
            await document.fonts.ready;
            // Delay slightly to ensure renders
            await new Promise(r => setTimeout(r, 500));

            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                backgroundColor: '#ffffff',
                cacheBust: false,
                pixelRatio: 4,
            });

            const link = document.createElement('a');
            link.download = `Struk-${transaction.id}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Berhasil diunduh!', { id: toastId });
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Gagal mengunduh gambar', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const copyAsText = () => {
        // Helper function to center text (32 chars width for thermal printer)
        const centerText = (text, width = 32) => {
            const padding = Math.max(0, Math.floor((width - text.length) / 2));
            return ' '.repeat(padding) + text;
        };

        let text = `${centerText(restaurantName.toUpperCase())}\n`;
        text += `${centerText(restaurantSlogan)}\n`;
        text += `--------------------------------\n`;
        text += `ID: ${transaction.id}\n`;
        text += `Tanggal: ${new Date(transaction.timestamp).toLocaleString("id-ID")}\n`;
        text += `Kasir: ${transaction.cashier_name || 'SISTEM'}\n`;

        // Payment Method
        const paymentMethodText = transaction.payment_method === 'employee_meal'
            ? 'MAKAN KARYAWAN'
            : (transaction.payment_method === 'cash' || transaction.payment_method === 'tunai' || transaction.payment_method === 'Tunai')
                ? 'TUNAI'
                : transaction.payment_method.toUpperCase();
        text += `Metode: ${paymentMethodText}\n`;
        text += `--------------------------------\n`;

        transaction.items.forEach(item => {
            text += `${item.name.substring(0, 20)}\n`;
            const priceVal = Number(item.price) || 0;
            const qtyVal = Number(item.quantity) || 0;
            const qtyPrice = `${qtyVal} x ${priceVal.toLocaleString("id-ID")}`;
            const subtotal = (priceVal * qtyVal).toLocaleString("id-ID");
            const spaces = 32 - qtyPrice.length - subtotal.length;
            text += `${qtyPrice}${" ".repeat(Math.max(1, spaces))}${subtotal}\n`;
            // Options
            if (item.options?.length > 0) {
                item.options.forEach(opt => text += ` + ${opt.name}\n`);
            }
        });

        text += `--------------------------------\n`;

        // Subtotal
        const subtotalLabel = "SUBTOTAL";
        const subtotalVal = `Rp ${Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}`;
        text += `${subtotalLabel}${" ".repeat(32 - subtotalLabel.length - subtotalVal.length)}${subtotalVal}\n`;

        // Discounts
        if (subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0) {
            const discLabel = "DISKON ITEM";
            const discVal = `-Rp ${(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}`;
            text += `${discLabel}${" ".repeat(32 - discLabel.length - discVal.length)}${discVal}\n`;
        }

        if (manualDiscountAmount > 0) {
            const manualDiscLabel = "DISKON TAMBAHAN";
            const manualDiscVal = `-Rp ${manualDiscountAmount.toLocaleString("id-ID")}`;
            text += `${manualDiscLabel}${" ".repeat(32 - manualDiscLabel.length - manualDiscVal.length)}${manualDiscVal}\n`;
        }

        // PPN/Tax
        if (ppnAmount > 0) {
            const ppnLabel = "PPN/TAX";
            const ppnVal = `Rp ${ppnAmount.toLocaleString("id-ID")}`;
            text += `${ppnLabel}${" ".repeat(32 - ppnLabel.length - ppnVal.length)}${ppnVal}\n`;
        }

        text += `--------------------------------\n`;

        // Total
        const totalLabel = "TOTAL";
        const totalVal = `Rp ${Number(transaction.total).toLocaleString("id-ID")}`;
        text += `${totalLabel}${" ".repeat(32 - totalLabel.length - totalVal.length)}${totalVal}\n`;

        // Cash Payment Details
        if ((transaction.payment_method === 'Tunai' || transaction.payment_method === 'tunai' || transaction.payment_method === 'cash') && transaction.cash_paid > 0) {
            text += `--------------------------------\n`;
            const bayarLabel = "BAYAR";
            const bayarVal = `Rp ${Number(transaction.cash_paid || 0).toLocaleString("id-ID")}`;
            text += `${bayarLabel}${" ".repeat(32 - bayarLabel.length - bayarVal.length)}${bayarVal}\n`;

            const kembaliLabel = "KEMBALI";
            const kembaliVal = `Rp ${Number(transaction.change || 0).toLocaleString("id-ID")}`;
            text += `${kembaliLabel}${" ".repeat(32 - kembaliLabel.length - kembaliVal.length)}${kembaliVal}\n`;
        }

        // Customer Notes
        if (transaction.catatan) {
            text += `--------------------------------\n`;
            text += `CATATAN:\n`;
            text += `"${transaction.catatan}"\n`;
        }

        text += `--------------------------------\n`;
        text += `${centerText('TERIMA KASIH')}\n`;
        text += `${centerText(restaurantUrl)}\n`;

        navigator.clipboard.writeText(text);
        toast.success('Format teks lengkap disalin!');
    };

    // Calculation Logic (Copied from original receipt logic to maintain consistency)
    const transactionDate = new Date(transaction.timestamp).toLocaleString("id-ID", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const subtotalBeforeAllDiscounts = transaction.items.reduce((sum, item) => {
        const originalBasePrice = Number(item.basePrice || item.price) || 0;
        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
        return sum + ((originalBasePrice + optionAdjustment) * (Number(item.quantity) || 0));
    }, 0);
    const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
        const pricePerUnit = Number(item.price) || 0;
        const itemDiscount = Number(item.discount) || 0;
        const effectivePricePerUnit = item.basePrice ? pricePerUnit : (itemDiscount > 0 ? pricePerUnit * (1 - itemDiscount) : pricePerUnit);
        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
        return sum + ((effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0));
    }, 0);
    const ppnAmount = Number(transaction.ppn) || 0;
    const manualDiscountAmount = Number(transaction.manual_discount) || 0;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            {/* Seller Header */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300`}>
                <div className="px-4 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-black text-gray-800 tracking-tight">Struk Digital</h1>
                    <div className="w-10"></div> {/* Spacer balance */}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 pt-24 pb-32 px-4 flex flex-col items-center">

                {/* The Invoice Card Container - Centered and Shadowed */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 relative">
                    {/* Print/Download Ref Container */}
                    <div ref={receiptRef} className="p-6 relative overflow-hidden bg-white">
                        {/* Modern Header - Minimalist & Sleek */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4">
                                {!logoUrl && <div className="absolute -inset-3 bg-primary/5 rounded-full blur-xl"></div>}
                                <div className={`relative flex items-center justify-center overflow-hidden transition-all ${logoUrl ? 'w-24 h-24 bg-transparent' : 'w-20 h-20 rounded-[1.5rem] border-2 border-primary/10 shadow-xl bg-primary text-white'}`}>
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                            onError={() => setLogoUrl('')}
                                        />
                                    ) : (
                                        <span className="text-3xl font-black italic">{restaurantName.charAt(0)}</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1.5">{restaurantName}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{restaurantSlogan}</p>

                            {/* Modern Divider */}
                            <div className="flex items-center gap-2 w-full mt-4 opacity-30">
                                <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
                            </div>
                        </div>

                        {/* High Tech Info Bar */}
                        <div className="flex items-center justify-between mb-8 px-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-100/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>

                            <div>
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-0.5">ID Referensi</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-mono font-black text-gray-900 leading-none">#{transaction.id.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-0.5">Dibuat Pada</span>
                                <span className="text-xs font-bold text-gray-900">{transactionDate.split(',')[0]}</span>
                                <span className="text-[9px] text-gray-400 font-bold block">{transactionDate.split(',')[1]}</span>
                            </div>
                        </div>

                        {/* Modern Product List */}
                        <div className="mb-8 px-1">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                    <Icon name="ShoppingCart" size={14} className="text-primary" />
                                    Detail Pembelian
                                </h3>
                                <div className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tight">
                                    {transaction.items.length} ITEM
                                </div>
                            </div>

                            <div className="space-y-4">
                                {transaction.items.map((item, index) => {
                                    const pricePerUnit = Number(item.price) || 0;
                                    const itemDiscount = Number(item.discount) || 0;
                                    const effectivePricePerUnit = item.basePrice ? pricePerUnit : (itemDiscount > 0 ? pricePerUnit * (1 - itemDiscount) : pricePerUnit);
                                    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0) : 0;
                                    const lineTotalAfterDiscount = (effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0);

                                    return (
                                        <div key={index} className="relative group pl-3">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-100 group-hover:bg-primary/30 transition-colors rounded-full"></div>

                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-black text-gray-900 leading-tight">{item.name}</span>
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-100 shadow-sm">
                                                            <span className="text-[9px] font-black text-gray-400">x</span>
                                                            <span className="text-[10px] font-black text-primary">{item.quantity}</span>
                                                        </div>
                                                    </div>

                                                    {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {item.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-1 bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-100/50">
                                                                    <div className="w-0.5 h-0.5 bg-indigo-400 rounded-full"></div>
                                                                    <span className="text-[8px] font-bold uppercase tracking-tight">{opt.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right ml-4 flex flex-col justify-center">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Subtotal</span>
                                                    <span className="text-sm font-mono font-black text-gray-900 tracking-tight tabular-nums">
                                                        {lineTotalAfterDiscount.toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary Glow Section */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-[2rem]"></div>
                            <div className="relative bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-gray-100/40 p-6 shadow-xl shadow-gray-100/20 overflow-hidden">
                                {/* Decorative Pattern */}
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <Icon name="Fingerprint" size={60} className="text-primary" />
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 font-black uppercase tracking-widest">Harga Dasar</span>
                                        <span className="text-gray-900 font-bold font-mono">Rp {Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}</span>
                                    </div>

                                    {(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0 || manualDiscountAmount > 0) && (
                                        <div className="flex justify-between items-center text-[10px] text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100/50">
                                            <span className="font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Icon name="Tag" size={10} /> Diskon
                                            </span>
                                            <span className="font-black font-mono">-Rp {(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts + manualDiscountAmount).toLocaleString("id-ID")}</span>
                                        </div>
                                    )}

                                    {ppnAmount > 0 && (
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 font-black uppercase tracking-widest">Tax (PPN)</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[7px] font-black bg-gray-100 px-1 py-0.5 rounded text-gray-500">VAT</span>
                                                <span className="text-gray-900 font-bold font-mono">Rp {ppnAmount.toLocaleString("id-ID")}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full mb-6"></div>

                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-2">Total Tagihan</span>
                                    <div className="text-3xl font-black text-gray-900 tracking-tighter mb-1.5 flex items-start gap-1">
                                        <span className="text-sm mt-1 text-primary">Rp</span>
                                        <span>{Number(transaction.total).toLocaleString("id-ID")}</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200 mt-1.5">
                                        <Icon name="Check" size={12} className="stroke-[4px]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Pembayaran Berhasil</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Payment Info (V2 Style) */}
                        {(transaction.payment_method === 'Tunai' || transaction.payment_method === 'tunai' || transaction.payment_method === 'cash') && transaction.cash_paid > 0 && (
                            <div className="flex gap-3 mb-8 px-2">
                                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">DIBAYAR</span>
                                    <span className="text-sm font-mono font-black text-gray-900">Rp {Number(transaction.cash_paid).toLocaleString("id-ID")}</span>
                                </div>
                                <div className="flex-1 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-sm shadow-emerald-100/50">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">KEMBALI</span>
                                    <span className="text-sm font-mono font-black text-emerald-700">Rp {Number(transaction.change).toLocaleString("id-ID")}</span>
                                </div>
                            </div>
                        )}

                        {/* Payment Details Pill */}
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-gray-900 rounded-full shadow-2xl shadow-gray-900/40">
                                <div className="flex flex-col items-center border-r border-gray-700 pr-4">
                                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">METODE</span>
                                    <span className="text-[9px] font-black text-white uppercase tracking-tight">
                                        {transaction.payment_method === 'employee_meal' ? 'MAKAN KARYAWAN' : (transaction.payment_method === 'cash' ? 'TUNAI' : transaction.payment_method.toUpperCase())}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">KASIR</span>
                                    <span className="text-[9px] font-black text-white uppercase tracking-tight">{transaction.cashier_name || 'SISTEM'}</span>
                                </div>

                                <div className="flex flex-col items-center border-l border-gray-700 pl-4 text-emerald-400">
                                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">STATUS</span>
                                    <Icon name="ShieldCheck" size={12} />
                                </div>
                            </div>
                        </div>
                        {/* Customer Notes (Modern Style) */}
                        {transaction.catatan && (
                            <div className="mb-8 px-2">
                                <div className="relative p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50 group overflow-hidden">
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-amber-200/20 rounded-full blur-xl group-hover:bg-amber-200/30 transition-colors"></div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon name="MessageSquare" size={14} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Catatan Pesanan</span>
                                    </div>
                                    <p className="text-xs text-amber-900 italic font-medium leading-relaxed pl-5 relative">
                                        <span className="absolute left-0 top-0 text-amber-300 text-lg leading-none">"</span>
                                        {transaction.catatan}
                                        <span className="text-amber-300 text-lg leading-none ml-0.5">"</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Aesthetic Footer */}
                        <div className="text-center pt-6 border-t border-dashed border-gray-200 relative">
                            {/* Modern Scallop Effect */}
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-gray-200">
                                <Icon name="Zap" size={10} className="fill-current" />
                            </div>

                            <h4 className="text-sm font-black text-gray-900 tracking-tighter uppercase mb-1.5">Terima Kasih</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-4">Sampai jumpa kembali!</p>

                            <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.4em]">{restaurantUrl}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
                    <button
                        onClick={handleWhatsAppShare}
                        className="flex flex-col items-center justify-center gap-1 bg-green-50 text-green-600 p-3 rounded-2xl active:scale-95 transition-all"
                    >
                        <Share2 size={24} />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center gap-1 bg-indigo-50 text-indigo-600 p-3 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Download size={24} />
                        <span className="text-[10px] font-bold">{isLoading ? 'Saving...' : 'Simpan'}</span>
                    </button>

                    <button
                        onClick={copyAsText}
                        className="flex flex-col items-center justify-center gap-1 bg-amber-50 text-amber-600 p-3 rounded-2xl active:scale-95 transition-all"
                    >
                        <Copy size={24} />
                        <span className="text-[10px] font-bold">Salin Teks</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="col-span-3 flex items-center justify-center gap-2 bg-gray-900 text-white p-4 rounded-2xl font-black shadow-lg shadow-gray-200 active:scale-95 transition-all"
                    >
                        <Printer size={20} />
                        <span>Cetak Struk Sekarang</span>
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                  @page { margin: 0; size: auto; }
                  body * { visibility: hidden; }
                  .min-h-screen { background: white !important; }
                  div[ref] { visibility: visible; position: absolute; top: 0; left: 0; width: 100%; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                  div[ref] * { visibility: visible; }
                }
            `}</style>
        </div>
    );
};

export default SellerReceipt;
