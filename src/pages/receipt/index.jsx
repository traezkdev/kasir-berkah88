
import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Share2, ArrowLeft } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const apiUrl = import.meta.env.VITE_API_URL;

const ReceiptPage = () => {
  const receiptRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction } = location.state || {};

  const [restaurantName, setRestaurantName] = useState('Trz Kasir Apps');
  const [restaurantSlogan, setRestaurantSlogan] = useState('Aplikasi kasir modern cepat dan keren');

  const fetchRestaurantSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/restaurant-settings`); // Public endpoint, no authFetch needed
      const data = await response.json();
      if (response.ok && data.data) {
        setRestaurantName(data.data.restaurant_name || 'Trz Kasir Apps');
        setRestaurantSlogan(data.data.restaurant_slogan || 'Aplikasi kasir modern cepat dan keren');
      } else {
        console.error('Failed to fetch restaurant settings:', data.error);
      }
    } catch (err) {
      console.error('Error fetching restaurant settings:', err);
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
        pixelRatio: 2,
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
    const transactionDate = new Date(transaction.timestamp).toLocaleString("id-ID", {
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
    message += `*Tanggal:* ${transactionDate}\n`;
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
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
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
    const originalBasePrice = Number(item.basePrice) || 0;
    const optionAdjustment = item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0);
    const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment; // Price per unit before any discount
    return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity) || 0));
  }, 0);

  // Subtotal after item-level discounts, before manual discount and PPN
  const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
    const pricePerUnitAfterDiscount = Number(item.price) || 0; // item.price is already finalPrice (after item discount & options)
    return sum + (pricePerUnitAfterDiscount * (Number(item.quantity) || 0));
  }, 0);


  return (
    <>
      <div className="bg-background min-h-screen flex flex-col items-center justify-center p-4">
        <div id="receipt-container" className="relative bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
          <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center p-4 sm:p-6">
            <div
              ref={receiptRef}
              className="bg-white shadow-2xl h-fit rounded-lg w-full max-w-[520px]"
            >
              <div className="p-8">
                <div className="text-center mb-5">
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">{restaurantName}</h2>
                  <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide uppercase">{restaurantSlogan}</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-6"></div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">ID Transaksi:</span>
                    <span className="text-gray-900 font-bold">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Tanggal:</span>
                    <span className="text-gray-900 font-semibold">{transactionDate}</span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-6"></div>

                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Detail Item
                  </h3>
                  <div className="space-y-4">
                    {transaction.items.map((item, index) => {
                      const pricePerUnitAfterDiscount = Number(item.price) || 0;
                      const lineTotalAfterDiscount = pricePerUnitAfterDiscount * (Number(item.quantity) || 0);

                      const originalBasePrice = Number(item.basePrice) || 0;
                      const optionAdjustment = item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0);
                      const originalPricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
                      const lineTotalBeforeDiscount = originalPricePerUnitBeforeDiscount * (Number(item.quantity) || 0);

                      return (
                        <div key={index} className="group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-semibold leading-tight">{item.name}</span>
                                <span className="text-gray-400 text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                              </div>
                              {item.discount > 0 && (
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                  {(item.discount * 100).toFixed(0)}% OFF
                                </span>
                              )}
                              {item.options && item.options.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.options.map((opt, optIndex) => (
                                    <span key={optIndex} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 italic">
                                      + {opt.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex flex-col items-end">
                              {item.discount > 0 && (
                                <span className="line-through text-gray-300 text-[10px] font-medium">
                                  Rp {lineTotalBeforeDiscount.toLocaleString("id-ID")}
                                </span>
                              )}
                              <span className="text-gray-900 font-bold tabular-nums">
                                Rp {lineTotalAfterDiscount.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-200 my-6"></div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="text-gray-900 font-semibold">Rp {Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}</span>
                  </div>
                  {subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span className="font-medium">Total Hemat Item</span>
                      <span className="font-semibold">- Rp {(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {ppnAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">PPN</span>
                      <span className="text-gray-900 font-semibold">Rp {ppnAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {manualDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span className="font-medium">Diskon Tambahan</span>
                      <span className="font-semibold">- Rp {manualDiscountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center mb-6 shadow-lg shadow-gray-200">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Pembayaran</span>
                  <span className="text-xl font-black tabular-nums whitespace-nowrap">
                    Rp {Number(transaction.total).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Metode Pembayaran</span>
                    <span className="text-gray-900 font-bold capitalize">
                      {transaction.payment_method === 'employee_meal' ? 'Makan Karyawan' : (transaction.payment_method === 'cash' ? 'Tunai' : transaction.payment_method)}
                    </span>
                  </div>
                  {(transaction.payment_method === 'Tunai' || transaction.payment_method === 'cash') && transaction.cash_paid > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Bayar Tunai</span>
                        <span className="text-gray-900 font-semibold">Rp {Number(transaction.cash_paid).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Kembalian</span>
                        <span className="text-green-600 font-bold">Rp {Number(transaction.change).toLocaleString("id-ID")}</span>
                      </div>
                    </>
                  )}
                </div>

                {transaction.catatan && (
                  <>
                    <div className="border-b-2 border-dashed border-gray-200 my-6"></div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <span className="text-amber-800 font-bold text-xs uppercase tracking-wider mb-2 block">Catatan Pesanan:</span>
                      <p className="text-amber-900 text-sm italic leading-relaxed whitespace-pre-wrap">"{transaction.catatan}"</p>
                    </div>
                  </>
                )}

                <div className="text-center mt-10">
                  <div className="inline-block px-4 py-2 bg-gray-50 rounded-full mb-4">
                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase italic">
                      Terima kasih telah berbelanja!
                    </p>
                  </div>
                  <div className="flex justify-center gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg space-y-4 print:hidden border-t dark:border-gray-800">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center gap-1 border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-auto py-3 px-2 transition-all duration-200 group"
              >
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-auto py-3 px-2 group"
              >
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                  <Share2 size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Share</span>
              </Button>
              <Button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-auto py-3 px-2 shadow-lg shadow-primary/20 group"
              >
                <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cetak Struk</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate('/transaksi')}
              className="w-full flex items-center justify-center gap-2 py-6 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Kembali ke Menu Kasir</span>
            </Button>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 58mm auto; /* Explicitly set paper size for thermal printers */
          }
          body {
            margin: 0;
            padding: 0;
            width: 58mm; /* Constrain body width */
          }
          body * {
            visibility: hidden;
          }
          #receipt-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 58mm; /* Ensure it doesn't overflow */
            box-sizing: border-box;
            margin: 0;
            padding: 2px 4px; /* Minimal padding */
            border: none;
            box-shadow: none;
            background-color: white;
            color: black;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* Modern Sans-serif */
            line-height: 1.2; /* Compact line height */
          }
          #receipt-container * {
            visibility: visible;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: black !important;
          }
          #receipt-container h2 {
            font-size: 14px !important; /* Slightly larger for title */
            font-weight: bold !important;
            margin-bottom: 2px;
            text-align: center;
          }
          #receipt-container p {
            font-size: 11px !important;
            margin-bottom: 2px;
            text-align: center;
          }
          #receipt-container .text-sm,
          #receipt-container span,
          #receipt-container div,
          #receipt-container h3 {
            font-size: 11px !important; /* Standardize specific text size */
          }
           #receipt-container .text-lg {
             font-size: 13px !important; /* Total price slightly larger */
             font-weight: bold !important;
           }
          /* Hide non-printable elements explicitly */
          .print\:hidden {
            display: none !important;
          }
          /* Adjust spacing for print */
          #receipt-container .mb-4 {
            margin-bottom: 6px !important;
          }
          #receipt-container .mb-2 {
            margin-bottom: 2px !important;
          }
          /* Compact spacing for lists */
          #receipt-container .space-y-2 > div {
            margin-bottom: 1px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ReceiptPage;
