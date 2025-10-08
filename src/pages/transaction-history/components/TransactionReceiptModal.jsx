
import React from "react";
import Button from "../../../components/ui/Button";
import { X } from "lucide-react";

const TransactionReceiptModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const transactionDate = new Date(transaction.timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          id="receipt-content"
          className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        >
          <div className="p-6 overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Berkah 88</h2>
              <p className="text-sm text-gray-500">Harga hemat, Rasa terhormat</p>
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
              <span>Rp {Number(transaction.total).toLocaleString("id-ID")}</span>
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
          <div className="p-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Tutup
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
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
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
