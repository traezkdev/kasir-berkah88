import React from 'react';
import { X, Calendar } from 'lucide-react';
import Button from '../../../components/ui/Button';

const ViewNoteModal = ({ note, onClose }) => {
  if (!note) return null;

  const formattedDate = new Date(note.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 break-words">{note.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-4 border-b pb-4">
            <Calendar size={14} className="mr-2" />
            <span>Terakhir diperbarui: {formattedDate}</span>
        </div>

        <div className="overflow-y-auto pr-2 flex-grow">
            <p className="text-gray-700 text-base whitespace-pre-wrap break-words">{note.content}</p>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
            <Button onClick={onClose}>
              Tutup
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewNoteModal;
