import React from 'react';
import { Edit, Trash2, Calendar } from 'lucide-react';
import Button from '../../../components/ui/Button';

const NoteCard = ({ note, onEdit, onDelete }) => {
  const formattedDate = new Date(note.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between h-full border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div>
        <h3 className="font-bold text-lg mb-2 truncate">{note.title}</h3>
        <p className="text-gray-600 text-sm mb-4 break-words whitespace-pre-wrap">{note.content}</p>
      </div>
      <div>
        <div className="flex items-center text-xs text-gray-400 mb-4">
            <Calendar size={14} className="mr-2" />
            <span>Diperbarui pada {formattedDate}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} aria-label="Edit Catatan">
            <Edit size={16} />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} aria-label="Hapus Catatan">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
