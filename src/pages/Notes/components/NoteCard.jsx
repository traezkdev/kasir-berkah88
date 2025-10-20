import React, { useState } from 'react';
import { Edit, Trash2, Calendar, Eye, User } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

const NoteCard = ({ note, currentUserId, onEdit, onDelete, onView }) => {
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(note.id);
    setShowConfirmDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDeleteModal(false);
  };
  const formattedDate = new Date(note.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });

  const isAuthor = note.user_id === currentUserId;

  return (
    <div className="bg-card shadow-md rounded-lg p-4 flex flex-col justify-between h-full border border-border hover:shadow-lg transition-shadow duration-200">
      <div>
        <h3 className="font-bold text-lg mb-2 truncate">{note.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 break-words whitespace-pre-wrap line-clamp-4">{note.content}</p>
      </div>
      <div>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
            <User size={14} className="mr-2" />
            <span>Dibuat oleh: <strong>{note.author || 'N/A'}</strong></span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
            <Calendar size={14} className="mr-2" />
            <span>Diperbarui pada {formattedDate}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onView} aria-label="Lihat Catatan">
            <Eye size={16} />
          </Button>
          {isAuthor && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit} aria-label="Edit Catatan">
                <Edit size={16} />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteClick} aria-label="Hapus Catatan">
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Catatan"
        message="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default NoteCard;