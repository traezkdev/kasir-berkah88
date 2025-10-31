
import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Share2, ArrowLeft } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const ReceiptPage = () => {
  const receiptRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction } = location.state || {};

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-500 text-lg mb-4">Data transaksi tidak ditemukan.</p>
        <Button onClick={() => navigate('/sales-transaction-processing')}>Kembali ke Kasir</Button>
      </div>
    );
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
    return sum + (Number(item.price) * Number(item.quantity));
  }, 0);

  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
        <div id="receipt-container" className="relative bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
          <div ref={receiptRef} className="p-6 overflow-y-auto bg-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Berkah 88</h2>
              <p className="text-sm text-gray-900">Harga hemat, Rasa terhormat</p>
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
                const originalPrice = Number(item.price) * Number(item.quantity);
                const discountedPrice = originalPrice * (1 - (item.discount || 0));
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-900">
                      {item.name} <span className="text-gray-500">x{item.quantity}</span>
                      {item.discount > 0 && (
                        <span className="text-red-500 ml-2">({item.discount * 100}% Diskon)</span>
                      )}
                    </span>
                    <span className="text-gray-900">
                      {item.discount > 0 && (
                        <span className="line-through text-gray-500 mr-1">Rp {originalPrice.toLocaleString("id-ID")}</span>
                      )}
                      Rp {discountedPrice.toLocaleString("id-ID")}
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
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex items-center justify-between print:hidden">
            <Button variant="outline" onClick={() => navigate('/sales-transaction-processing')} className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Kembali
            </Button>
            <div className="flex items-center space-x-3">
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
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
          }
          .print\:hidden {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default ReceiptPage;
