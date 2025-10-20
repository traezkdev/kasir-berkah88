
import React, { useRef } from "react";
import Button from "../../../components/ui/Button";
import { X, Share2 } from "lucide-react";
import * as htmlToImage from 'html-to-image';

const TransactionReceiptModal = ({ isOpen, onClose, transaction }) => {
  const receiptRef = useRef(null);

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
    return sum + (Number(item.price) * Number(item.quantity));
  }, 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          id="receipt-container"
          className="relative bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        >
          <div ref={receiptRef} className="p-6 overflow-y-auto bg-card">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Berkah 88</h2>
              <p className="text-sm text-text-secondary">Harga hemat, Rasa terhormat</p>
            </div>
            <div className="border-b border-dashed border-gray-400 mb-4"></div>
            <div className="flex justify-between text-sm mb-2">
              <span>ID Transaksi:</span>
              <span>{transaction.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span>Tanggal:</span>
              <span>{transactionDate}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 mb-4"></div>
            <h3 className="font-semibold mb-2">Detail Item:</h3>
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} <span className="text-gray-500">x{item.quantity}</span>
                  </span>
                  <span>Rp {Number(item.price * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between font-semibold text-sm mb-2">
              <span>Subtotal:</span>
              <span>Rp {Number(subtotalAmount).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-lg">TOTAL:</span>
              <span className="text-lg">Rp {Number(transaction.total).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-4"></div>
            <div className="flex justify-between text-sm">
              <span>Metode Pembayaran:</span>
              <span>{transaction.payment_method}</span>
            </div>
            <div className="text-center mt-8 text-sm text-gray-500">
              <p>Terima kasih telah berbelanja!</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex items-center justify-end space-x-3 print:hidden">
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
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
          }
        }
      `}</style>
    </>
  );
};

export default TransactionReceiptModal;
