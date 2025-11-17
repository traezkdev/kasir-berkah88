
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
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { pixelRatio: 2 });
      
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

  const subtotalAmount = transaction.items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    // Assuming item.price is the discounted price, so we just sum it up
    return sum + (itemPrice * itemQuantity);
  }, 0);

  // Calculate PPN based on the difference between total and the corrected subtotal
  const ppnAmount = transaction.total - subtotalAmount;

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
              {transaction.items.map((item) => {
                // item.price is the discounted price per unit.
                const discountedLinePrice = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                
                // Calculate the original price for display purposes by reversing the discount.
                const originalLinePrice = item.discount > 0 && (1 - Number(item.discount)) > 0
                  ? discountedLinePrice / (1 - Number(item.discount))
                  : discountedLinePrice;

                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-900">
                      {item.name} <span className="text-gray-500">x{item.quantity}</span>
                      {item.discount > 0 && (
                        <span className="text-red-500 ml-2">({(item.discount * 100).toFixed(0)}% Diskon)</span>
                      )}
                    </span>
                    <span className="text-gray-900">
                      {item.discount > 0 && (
                        <span className="line-through text-gray-500 mr-1">
                          Rp {originalLinePrice.toLocaleString("id-ID")}
                        </span>
                      )}
                      Rp {discountedLinePrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between font-semibold text-sm mb-2">
              <span className="text-gray-900">Subtotal:</span>
              <span className="text-gray-900">Rp {Number(subtotalAmount).toLocaleString("id-ID")}</span>
            </div>
            {ppnAmount > 0 && (
              <div className="flex justify-between font-semibold text-sm mb-2">
                <span className="text-gray-900">PPN:</span>
                <span className="text-gray-900">Rp {ppnAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span className="text-lg text-gray-900">TOTAL:</span>
              <span className="text-lg text-black">Rp {Number(transaction.total).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between text-sm">
              <span className="text-black">Metode Pembayaran:</span>
              <span className="text-black">{transaction.payment_method}</span>
            </div>
            {transaction.payment_method === 'Tunai' && transaction.cash_paid > 0 && (
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
          body * {
            visibility: hidden;
          }
          #receipt-container, #receipt-container * {
            visibility: visible;
          }
          #receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm; /* Fixed width for thermal printer */
            height: auto; /* Allow height to adjust */
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
            /* Adjust font sizes for thermal printer */
            font-size: 8pt; /* Base font size */
            line-height: 1.2;
          }
          #receipt-container h2 { /* Berkah 88 */
            font-size: 12pt !important;
          }
          #receipt-container p,
          #receipt-container span,
          #receipt-container div {
            font-size: 8pt !important;
          }
          #receipt-container .text-lg { /* TOTAL */
            font-size: 10pt !important;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default TransactionReceiptModal;
