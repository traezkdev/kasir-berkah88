
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
                // item.price here is the final price per unit (after options and discount)
                const pricePerUnitAfterDiscount = Number(item.price) || 0;
                const lineTotalAfterDiscount = pricePerUnitAfterDiscount * (Number(item.quantity) || 0);

                // Calculate original price per unit including options but before discount
                const originalBasePrice = Number(item.basePrice) || 0;
                const optionAdjustment = item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0);
                const originalPricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
                const lineTotalBeforeDiscount = originalPricePerUnitBeforeDiscount * (Number(item.quantity) || 0);

                return (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-900">
                        {item.name} <span className="text-gray-500">x{item.quantity}</span>
                      </span>
                      {item.discount > 0 && (
                        <span className="text-red-500 ml-2">({(item.discount * 100).toFixed(0)}% Diskon)</span>
                      )}
                      <span className="text-gray-900 flex items-baseline gap-2 justify-end">
                        {item.discount > 0 && (
                          <span className="line-through text-gray-500 text-xs">
                            Rp {lineTotalBeforeDiscount.toLocaleString("id-ID")}
                          </span>
                        )}
                        <span>Rp {lineTotalAfterDiscount.toLocaleString("id-ID")}</span>
                      </span>
                    </div>
                    {item.options && item.options.length > 0 && (
                      <div className="pl-4 text-xs text-gray-500">
                        {item.options.map(opt => `+ ${opt.name}`).join(', ')}
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
                <span className="text-red-500">Diskon Manual:</span> {/* Ubah menjadi Diskon Manual */}
                <span className="text-red-500">- Rp {manualDiscountAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span className="text-lg text-gray-900">TOTAL:</span>
              <span className="text-lg text-gray-900">Rp {Number(transaction.total).toLocaleString("id-ID")}</span>
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
            {transaction.catatan && (
              <div className="border-b border-dashed border-gray-400 my-4"></div>
            )}
            {transaction.catatan && (
              <div className="text-left text-sm mb-2">
                <span className="text-black font-semibold block">Catatan:</span>
                <p className="text-black whitespace-pre-wrap">{transaction.catatan}</p>
              </div>
            )}
            <div className="text-center mt-8 text-sm text-gray-500">
              <p>Terima kasih telah berbelanja!</p>
            </div>
          </div>
          <div className="p-4 bg-muted/50 dark:bg-gray-900 rounded-b-lg flex items-center justify-between print:hidden">
            <Button variant="outline" onClick={() => navigate('/transaksi')} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Kembali
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleWhatsAppShare} className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                <svg size={16} viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                <Share2 size={16} />
                Bagikan
              </Button>
              <Button onClick={handlePrint}>Cetak</Button>
            </div>
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
