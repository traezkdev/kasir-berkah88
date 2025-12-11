
import React, { useRef, useState, useEffect } from "react";
import Button from "../../../components/ui/Button";
import { X, Share2 } from "lucide-react";
import * as htmlToImage from 'html-to-image';

const apiUrl = import.meta.env.VITE_API_URL;

const TransactionReceiptModal = ({ isOpen, onClose, transaction }) => {
  const receiptRef = useRef(null);

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

  if (!isOpen || !transaction) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { pixelRatio: 4 }); // Increased pixelRatio for higher resolution and better clarity

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `struk-${transaction.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Struk Transaksi ${transaction.id}`,
          text: `Berikut adalah struk untuk transaksi ${transaction.id}`,
          files: [file],
        });
      } else {
        // Fallback for desktop or browsers that don't support Web Share API
        const link = document.createElement('a');
        link.download = `struk-${transaction.id}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('oops, something went wrong!', error);
      alert('Gagal membagikan struk. Silakan coba lagi.');
    }
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
    const originalBasePrice = Number(item.basePrice || item.price) || 0; // Use item.basePrice or item.price for original
    // Ensure item.options is an array before reducing
    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
    const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
    return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity) || 0));
  }, 0);

  // Subtotal after item-level discounts, before manual discount and PPN
  const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
    // item.price is already finalPrice for SalesTransactionProcessing, or basePrice for CashierDashboard
    const priceAfterItemDiscountAndOptions = Number(item.price) || 0;
    // If item.discount is present, it means item.price was likely basePrice and discount needs to be applied
    const effectivePricePerUnit = item.discount ? priceAfterItemDiscountAndOptions * (1 - item.discount) : priceAfterItemDiscountAndOptions;
    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
    return sum + ((effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0));
  }, 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          id="receipt-container"
          className="relative bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        >
          <div ref={receiptRef} className="p-6 overflow-y-auto bg-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{restaurantName}</h2>
              <p className="text-sm text-gray-900">{restaurantSlogan}</p>
            </div>
            <div className="border-b border-dashed border-gray-400 mb-4"></div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900">ID Transaksi:</span>
              <span className="text-gray-900">{transaction.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-900">Tanggal:</span>
              <span className="text-gray-900">{transactionDate}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 mb-4"></div>
            <h3 className="font-semibold mb-2 text-gray-900">Detail Item:</h3>
            <div className="space-y-2">
              {transaction.items.map((item, index) => {
                const pricePerUnit = Number(item.price) || 0;
                const itemDiscount = Number(item.discount) || 0;

                let effectivePricePerUnit;
                if (item.basePrice) { // From SalesTransactionProcessing, item.price is already the final price
                  effectivePricePerUnit = pricePerUnit;
                } else if (itemDiscount > 0) { // From CashierDashboard, item.price is base price, apply discount
                  effectivePricePerUnit = pricePerUnit * (1 - itemDiscount);
                } else { // No discount, item.price is the final price
                  effectivePricePerUnit = pricePerUnit;
                }

                const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;

                const lineTotalAfterDiscount = (effectivePricePerUnit + optionAdjustment) * (Number(item.quantity) || 0);

                // Calculate original price per unit including options but before discount
                const originalBasePrice = Number(item.basePrice || item.price) || 0;
                const optionAdjustmentForOriginalPrice = Array.isArray(item.options) ? item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0) : 0;
                const originalPricePerUnitBeforeDiscount = originalBasePrice + optionAdjustmentForOriginalPrice;
                const lineTotalBeforeDiscount = originalPricePerUnitBeforeDiscount * (Number(item.quantity) || 0);

                return (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-900">
                        {item.name} <span className="text-gray-500">x{item.quantity}</span>
                        {item.discount > 0 && (
                          <span className="text-red-500 ml-2">({(item.discount * 100).toFixed(0)}% Diskon)</span>
                        )}
                      </span>
                      <span className="text-gray-900 flex items-baseline gap-2 justify-end">
                        {item.discount > 0 && (
                          <span className="line-through text-gray-500 text-xs">
                            Rp {lineTotalBeforeDiscount.toLocaleString("id-ID")}
                          </span>
                        )}
                        <span>Rp {lineTotalAfterDiscount.toLocaleString("id-ID")}</span>
                      </span>
                    </div>
                    {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="pl-4 text-xs text-gray-500">
                        {item.options.map((opt, optIndex) => <p key={optIndex}>+ {opt.name}</p>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between font-semibold text-sm mb-2">
              <span className="text-gray-900">Subtotal:</span>
              <span className="text-gray-900">Rp {Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}</span>
            </div>
            {subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts > 0 && (
              <div className="flex justify-between font-semibold text-sm mb-2 text-red-500"> {/* Diskon biasanya merah */}
                <span className="text-gray-900">Diskon Item:</span>
                <span className="text-gray-900">- Rp {(subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts).toLocaleString("id-ID")}</span>
              </div>
            )}
            {ppnAmount > 0 && (
              <div className="flex justify-between font-semibold text-sm mb-2">
                <span className="text-gray-900">PPN:</span>
                <span className="text-gray-900">Rp {ppnAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
            {manualDiscountAmount > 0 && (
              <div className="flex justify-between font-semibold text-sm mb-2 text-red-500">
                <span className="text-red-500">Diskon:</span>
                <span className="text-red-500">- Rp {manualDiscountAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span className="text-lg text-gray-900">TOTAL:</span>
              <span className="text-lg text-black">Rp {Number(transaction.total).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between text-sm">
              <span className="text-black">Metode Pembayaran:</span>
              <span className="text-black">{transaction.payment_method === 'employee_meal' ? 'Makan Karyawan' : (transaction.payment_method === 'cash' ? 'Tunai' : transaction.payment_method)}</span>
            </div>
            {(transaction.payment_method === 'Tunai' || transaction.payment_method === 'cash') && transaction.cash_paid > 0 && (
              <>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-black">Tunai:</span>
                  <span className="text-black">
                    Rp {Number(transaction.cash_paid).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black">Kembalian:</span>
                  <span className="text-black">
                    Rp {Number(transaction.change).toLocaleString("id-ID")}
                  </span>
                </div>
              </>
            )}
            <div className="text-center mt-8 text-sm text-gray-500">
              <p>Terima kasih telah berbelanja!</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex items-center justify-center space-x-3 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
              <Share2 size={16} />
              Bagikan
            </Button>
            <Button onClick={handlePrint}>Cetak</Button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 print:hidden"
          >
            <X size={20} />
          </button>
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
            width: 100%; /* Adapts to printer paper width (58mm or 80mm) */
            max-width: none;
            box-sizing: border-box;
            margin: 0;
            padding: 4px; /* Minimal padding */
            border: none;
            box-shadow: none;
            background-color: white;
            color: black;
            font-family: 'Courier New', Courier, monospace; /* Classic receipt font */
          }
          #receipt-container h2, 
          #receipt-container p, 
          #receipt-container span, 
          #receipt-container div, 
          #receipt-container h3 {
            visibility: visible;
            color: black !important;
            font-family: 'Courier New', Courier, monospace;
          }
          #receipt-container h2 {
            font-size: 14px !important;
            font-weight: bold !important;
            margin-bottom: 2px;
          }
          #receipt-container p {
            font-size: 10px !important;
            margin-bottom: 4px;
          }
          #receipt-container .text-sm,
          #receipt-container span,
          #receipt-container div,
          #receipt-container h3,
          #receipt-container .text-lg {
            font-size: 11px !important;
          }
          /* Hide non-printable elements explicitly */
          .print\\:hidden {
            display: none !important;
          }
          /* Ensure good spacing for lists */
          #receipt-container .space-y-2 > div {
            margin-bottom: 2px !important;
          }
        }
      `}</style>
    </>
  );
};

export default TransactionReceiptModal;
