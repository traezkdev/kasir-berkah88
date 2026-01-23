
import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Share2, ArrowLeft } from 'lucide-react';
import Icon from '../../components/AppIcon';
import * as htmlToImage from 'html-to-image';
import toast from 'react-hot-toast';

const apiUrl = import.meta.env.VITE_API_URL;

const ReceiptPage = () => {
  const receiptRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction } = location.state || {};

  const [restaurantName, setRestaurantName] = useState('Trz Kasir Apps');
  const [restaurantSlogan, setRestaurantSlogan] = useState('Aplikasi kasir modern cepat dan keren');
  const [restaurantUrl, setRestaurantUrl] = useState('www.berkah88.id');
  const [logoUrl, setLogoUrl] = useState('');
  const [receiptVersion, setReceiptVersion] = useState('1');

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
        setLogoUrl(fullUrl);
      }

      const versionData = await versionRes.json();
      if (versionRes.ok && versionData.data?.value) {
        setReceiptVersion(versionData.data.value);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchRestaurantSettings();
  }, []);

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-500 text-lg mb-4">Data transaksi tidak ditemukan.</p>
        <Button onClick={() => navigate('/transaksi')}>Kembali ke Kasir</Button>
      </div>
    );
  }

  const handleShare = async () => {
    if (receiptRef.current === null) {
      return;
    }

    try {
      // Capture the receipt as a PNG image
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 4, // Higher ratio for ultra-sharp quality
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '520px',
          minWidth: '520px',
          maxWidth: '520px',
        }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `struk-${transaction.id}.png`, { type: 'image/png' });

      // Check if Web Share API is supported and can share files
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Struk Transaksi',
          text: `Struk Transaksi ${transaction.id} - ${restaurantName}`,
        });
      } else {
        // Fallback: download the image if sharing is not supported
        const link = document.createElement('a');
        link.download = `struk-${transaction.id}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const transactionDateStr = new Date(transaction.timestamp).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `*${restaurantName.toUpperCase()}*\n`;
    message += `${restaurantSlogan}\n`;
    message += `--------------------------\n`;
    message += `*ID Transaksi:* ${transaction.id}\n`;
    message += `*Tanggal:* ${transactionDateStr}\n`;
    message += `--------------------------\n`;
    message += `*Detail Pesanan:*\n`;

    transaction.items.forEach((item) => {
      const pricePerUnitAfterDiscount = Number(item.price) || 0;
      const totalItemPrice = pricePerUnitAfterDiscount * (Number(item.quantity) || 0);

      message += `- ${item.name} x${item.quantity}: *Rp ${totalItemPrice.toLocaleString("id-ID")}*`;
      if (item.options && item.options.length > 0) {
        const optionsStr = item.options.map(o => o.name).join(', ');
        message += `\n  _( ${optionsStr} )_`;
      }
      message += `\n`;
    });

    message += `--------------------------\n`;
    message += `*Subtotal:* Rp ${Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}\n`;

    if (subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0) {
      message += `*Diskon Item:* -Rp ${(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}\n`;
    }

    if (ppnAmount > 0) {
      message += `*PPN:* Rp ${ppnAmount.toLocaleString("id-ID")}\n`;
    }

    if (manualDiscountAmount > 0) {
      message += `*Diskon:* -Rp ${manualDiscountAmount.toLocaleString("id-ID")}\n`;
    }

    message += `*TOTAL: Rp ${Number(transaction.total).toLocaleString("id-ID")}*\n`;
    message += `--------------------------\n`;
    message += `*Metode Bayar:* ${transaction.payment_method === 'employee_meal' ? 'Makan Karyawan' : (transaction.payment_method === 'cash' ? 'Tunai' : transaction.payment_method)}\n`;

    if (transaction.catatan) {
      message += `*Catatan:* ${transaction.catatan}\n`;
    }

    message += `\nTerima kasih telah berbelanja!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
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

      // For display in copy text, we show the item's unit price and the subtotal for that line
      const qtyPrice = `${qtyVal} x ${priceVal.toLocaleString("id-ID")}`;
      const itemSubtotal = (priceVal * qtyVal).toLocaleString("id-ID");
      const spaces = 32 - qtyPrice.length - itemSubtotal.length;
      text += `${qtyPrice}${" ".repeat(Math.max(1, spaces))}${itemSubtotal}\n`;

      // Options
      if (item.options?.length > 0) {
        item.options.forEach(opt => text += ` + ${opt.name}\n`);
      }

      // Item Discount if applicable
      if (item.discount > 0) {
        text += ` HEMAT ${(item.discount * 100).toFixed(0)}%\n`;
      }
    });

    text += `--------------------------------\n`;

    // Subtotal
    const subtotalLabel = "SUBTOTAL";
    const subtotalVal = `Rp ${Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}`;
    text += `${subtotalLabel}${" ".repeat(32 - subtotalLabel.length - subtotalVal.length)}${subtotalVal}\n`;

    // Item Discounts
    if (subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0) {
      const discLabel = "DISKON ITEM";
      const discVal = `-Rp ${(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}`;
      text += `${discLabel}${" ".repeat(32 - discLabel.length - discVal.length)}${discVal}\n`;
    }

    // Manual Discount
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

    // Cash Payment Details (only for cash transactions)
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
    toast.success('Format teks lengkap disalin! Silakan paste di aplikasi Printer.');
  };

  const transactionDate = new Date(transaction.timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ppnAmount = Number(transaction.ppn) || 0;
  const manualDiscountAmount = Number(transaction.manual_discount) || 0;

  // Calculate subtotal based on original prices (basePrice + options) for all items
  const subtotalBeforeAllDiscounts = transaction.items.reduce((sum, item) => {
    const originalBasePrice = Number(item.basePrice || item.price) || 0;
    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
    const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
    return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity) || 0));
  }, 0);

  // Subtotal after item-level discounts, before manual discount and PPN
  const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
    const pricePerUnit = Number(item.price) || 0;
    const itemDiscount = Number(item.discount) || 0;
    const effectivePricePerUnit = item.basePrice ? pricePerUnit : (itemDiscount > 0 ? pricePerUnit * (1 - itemDiscount) : pricePerUnit);
    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
    return sum + ((effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0));
  }, 0);

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 cursor-default selection:bg-primary/10 overflow-hidden">
        <div
          id="receipt-container"
          className="relative w-full h-full sm:h-auto sm:max-h-[95vh] lg:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden sm:rounded-2xl flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500"
        >
          {/* Header Section (Synced with Modal) */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-white dark:bg-slate-900 z-10 shrink-0">
            <h2 className="text-xl font-semibold text-foreground">Detail Transaksi #{transaction?.id}</h2>
            <Button variant="ghost" size="icon" onClick={() => navigate('/transaksi')}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 flex justify-center p-4 sm:p-6 custom-scrollbar">
            <div
              ref={receiptRef}
              className="bg-white shadow-2xl h-fit rounded-lg w-full max-w-[520px] mb-8"
            >
              <div>
                {receiptVersion === '2' ? (
                  // --- VERSION 2 (MODERN) ---
                  <div className="p-6 relative overflow-hidden bg-white">
                    {/* Modern Header - Minimalist & Sleek */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative mb-4">
                        {!logoUrl && <div className="absolute -inset-3 bg-primary/5 rounded-full blur-xl"></div>}
                        <div className={`relative flex items-center justify-center overflow-hidden transition-all ${logoUrl ? 'w-24 h-24 bg-transparent' : 'w-20 h-20 rounded-[1.5rem] border-2 border-primary/10 shadow-xl bg-primary text-white'}`}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
                    {(transaction.payment_method?.toLowerCase() === 'tunai' || transaction.payment_method?.toLowerCase() === 'cash') && (
                      <div className="flex gap-3 mb-8 px-2">
                        <div className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">DIBAYAR</span>
                          <span className="text-sm font-mono font-black text-gray-900">Rp {Number(transaction.cash_paid || 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex-1 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-sm shadow-emerald-100/50">
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">KEMBALI</span>
                          <span className="text-sm font-mono font-black text-emerald-700">Rp {Number(transaction.change || 0).toLocaleString("id-ID")}</span>
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
                      <div className="mb-8 px-2 text-left">
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
                ) : (
                  // --- VERSION 1 (CLASSIC) ---
                  <div className="p-8 relative overflow-hidden">
                    {/* Decorative cut effect at top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20"></div>

                    {/* Header Section */}
                    <div className="text-center mb-8">
                      <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-4 border transition-all ${logoUrl ? 'bg-transparent border-transparent' : 'bg-primary/5 border-primary/10'}`}>
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden transition-all ${logoUrl ? 'bg-transparent' : 'bg-primary text-white shadow-lg shadow-primary/20'
                          }`}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-2xl font-black italic">{restaurantName.charAt(0)}</span>
                          )}
                        </div>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase font-mono">{restaurantName}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="h-px w-4 bg-gray-200"></span>
                        <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">{restaurantSlogan}</p>
                        <span className="h-px w-4 bg-gray-200"></span>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-8">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">ID Invoice</span>
                        <span className="text-sm font-mono font-bold text-gray-900">#{transaction.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Tanggal</span>
                        <span className="text-sm font-semibold text-gray-900">{transactionDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Metode Bayar</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                          {transaction.payment_method === 'employee_meal' ? 'Makan Karyawan' : (transaction.payment_method === 'cash' ? 'Tunai' : transaction.payment_method)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Status</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Lunas & Terverifikasi</span>
                      </div>
                    </div>

                    {/* Items Selection */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          Ringkasan Pesanan
                        </h3>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{transaction.items.length} Item</span>
                      </div>

                      <div className="space-y-4">
                        {transaction.items.map((item, index) => {
                          const pricePerUnit = Number(item.price) || 0;
                          const itemDiscount = Number(item.discount) || 0;
                          const effectivePricePerUnit = item.basePrice ? pricePerUnit : (itemDiscount > 0 ? pricePerUnit * (1 - itemDiscount) : pricePerUnit);
                          const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0) : 0;
                          const lineTotalAfterDiscount = (effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0);

                          const originalBasePrice = Number(item.basePrice || item.price) || 0;
                          const optionAdjustmentForOriginalPrice = Array.isArray(item.options) ? item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0) : 0;
                          const originalPricePerUnitBeforeDiscount = originalBasePrice + optionAdjustmentForOriginalPrice;
                          const lineTotalBeforeDiscount = originalPricePerUnitBeforeDiscount * (Number(item.quantity) || 0);

                          return (
                            <div key={index} className="flex justify-between items-start group">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-bold text-gray-900 leading-tight">{item.name}</span>
                                  <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                </div>

                                {item.discount > 0 && (
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block mb-1">
                                    HEMAT {(item.discount * 100).toFixed(0)}%
                                  </span>
                                )}

                                {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.options.map((opt, optIndex) => (
                                      <span key={optIndex} className="text-[9px] text-gray-400 font-medium">
                                        + {opt.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="text-right ml-4">
                                {item.discount > 0 && (
                                  <span className="line-through text-gray-300 text-[10px] font-medium block h-3">
                                    Rp {lineTotalBeforeDiscount.toLocaleString("id-ID")}
                                  </span>
                                )}
                                <span className="text-sm font-mono font-bold text-gray-900 tabular-nums">
                                  Rp {lineTotalAfterDiscount.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total Calculations */}
                    <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 shadow-inner">
                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-bold uppercase tracking-wider">Subtotal</span>
                          <span className="text-gray-900 font-bold font-mono">Rp {Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}</span>
                        </div>

                        {subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0 && (
                          <div className="flex justify-between text-xs text-red-500">
                            <span className="font-bold uppercase tracking-wider">Total Hemat Item</span>
                            <span className="font-bold font-mono">-Rp {(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}</span>
                          </div>
                        )}

                        {ppnAmount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">PPN</span>
                            <span className="text-gray-900 font-bold font-mono">Rp {ppnAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}

                        {manualDiscountAmount > 0 && (
                          <div className="flex justify-between text-xs text-red-500">
                            <span className="font-bold uppercase tracking-wider">Diskon Tambahan</span>
                            <span className="font-bold font-mono">-Rp {manualDiscountAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-gray-200 w-full mb-5 border-t border-dashed"></div>

                      <div className="flex justify-between items-center bg-gray-900 text-white rounded-xl p-4 shadow-lg shadow-gray-200">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1">Total Tagihan</span>
                          <span className="text-lg font-black font-mono tracking-tight">
                            Rp {Number(transaction.total).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="bg-primary/20 p-2 rounded-lg">
                          <Icon name="CheckCircle2" size={24} className="text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Additional Payment Info */}
                    {(transaction.payment_method?.toLowerCase() === 'tunai' || transaction.payment_method?.toLowerCase() === 'cash') && (
                      <div className="mt-6 flex justify-between gap-4 px-4">
                        <div className="flex-1 text-center py-2 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-[8px] font-bold text-gray-400 uppercase block">DIBAYAR</span>
                          <span className="text-xs font-bold text-gray-900">Rp {Number(transaction.cash_paid || 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex-1 text-center py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="text-[8px] font-bold text-emerald-600 uppercase block">KEMBALI</span>
                          <span className="text-xs font-extrabold text-emerald-700">Rp {Number(transaction.change || 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    )}

                    {/* Customer Notes (Modern Style) */}
                    {transaction.catatan && (
                      <div className="mt-8 relative p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50 group overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-amber-200/20 rounded-full blur-xl group-hover:bg-amber-200/30 transition-colors"></div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="MessageSquare" size={14} className="text-amber-500" />
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Catatan Pesanan</span>
                        </div>
                        <p className="text-xs text-amber-900 italic font-medium leading-relaxed pl-5 relative text-left">
                          <span className="absolute left-0 top-0 text-amber-300 text-lg leading-none">"</span>
                          {transaction.catatan}
                          <span className="text-amber-300 text-lg leading-none ml-0.5">"</span>
                        </p>
                      </div>
                    )}

                    {/* Footer Section */}
                    <div className="mt-12 text-center">
                      <div className="mb-6 flex justify-center opacity-20">
                        <div className="flex gap-1.5">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-1 h-3 bg-gray-900 rounded-full transform -rotate-12"></div>
                          ))}
                        </div>
                      </div>

                      <div className="inline-block px-5 py-2 bg-primary/5 rounded-full border border-primary/10">
                        <p className="text-[10px] text-primary font-black tracking-widest uppercase">
                          Terima kasih telah berbelanja!
                        </p>
                      </div>

                      <p className="text-[9px] text-gray-300 font-bold mt-4 tracking-widest uppercase">
                        {restaurantUrl}
                      </p>
                    </div>

                    {/* Decorative bottom effect */}
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-gray-50 -mb-2 border border-transparent shadow-sm"></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center border-t dark:border-gray-700 print:hidden shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => navigate('/transaksi')}
                className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2"
              >
                Tutup
              </Button>
              <Button
                variant="outline"
                onClick={copyAsText}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-3 py-2"
              >
                <Icon name="Copy" className="w-4 h-4" />
                Salin Teks
              </Button>
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-green-500 text-green-600 hover:bg-green-50 text-xs sm:text-sm px-3 py-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WA
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2"
              >
                <Share2 size={16} />
                Share
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1 sm:flex-none text-xs sm:text-sm px-4 py-2"
              >
                Cetak Struk
              </Button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #receipt-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 380px !important; /* Fixed width for thermal drivers to treat as text */
            max-width: none;
            box-sizing: border-box;
            margin: 0;
            padding: 10px;
            border: none;
            box-shadow: none;
            background-color: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          /* Remove ANY icons/SVGs from printing to avoid graphics mode */
          svg, .app-icon, img.w-6, img.w-8 {
            display: none !important;
          }
          /* Ensure logo stays if it's the main header logo */
          #receipt-container img.w-24, #receipt-container img.w-32 {
            display: block !important;
            filter: grayscale(100%) contrast(200%);
            margin: 0 auto 10px auto !important;
          }
          #receipt-container h2, 
          #receipt-container p, 
          #receipt-container span, 
          #receipt-container div, 
          #receipt-container h3 {
            visibility: visible;
            color: black !important;
            background: transparent !important;
            font-family: 'Courier New', Courier, monospace !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #receipt-container h2 {
            font-size: 18px !important;
            font-weight: bold !important;
            margin-bottom: 5px;
            text-align: center;
          }
          #receipt-container p {
            font-size: 13px !important;
            margin-bottom: 5px;
            text-align: center;
          }
          #receipt-container .text-sm,
          #receipt-container span,
          #receipt-container div,
          #receipt-container h3,
          #receipt-container table {
            font-size: 14px !important;
            line-height: 1.2 !important;
          }
          /* Hide non-printable elements explicitly */
          .print\\:hidden {
            display: none !important;
          }
          /* Version 2 specific print adjustments - Full High Contrast */
          #receipt-container .bg-gray-900,
          #receipt-container .bg-emerald-500,
          #receipt-container .bg-gray-100 {
            background-color: transparent !important;
            color: black !important;
            border: 1px solid black !important;
            border-radius: 0 !important;
          }
          #receipt-container .text-white, 
          #receipt-container .text-emerald-500,
          #receipt-container .text-gray-400 {
            color: black !important;
          }
          /* Divider styling for print */
          #receipt-container hr, 
          #receipt-container .border-dashed {
            border-color: black !important;
            border-style: dashed !important;
            border-width: 1px 0 0 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default ReceiptPage;
