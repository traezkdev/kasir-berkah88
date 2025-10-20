import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import authFetch from '../../../utils/authFetch';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const NoteFormModal = ({ note, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = note !== null;

  useEffect(() => {
    if (isEditing) {
      setTitle(note.title);
      setContent(note.content || '');
    }
  }, [note, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const noteData = { title, content };
    const url = isEditing ? `/api/notes/${note.id}` : '/api/notes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || 'Gagal menyimpan catatan.');
      }

      onSave(); // This will trigger a re-fetch in the parent and close the modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Catatan' : 'Tambah Catatan Baru'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Judul</label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul catatan..."
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">Isi Catatan</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan isi catatan di sini..."
              rows={8}
              className="w-full px-3 py-2 text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          {error && <p className="text-destructive text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteFormModal;
