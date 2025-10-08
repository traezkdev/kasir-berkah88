import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';

import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NoteFormModal from './components/NoteFormModal';
import NoteCard from './components/NoteCard';
import NavigationHeader from '../../components/ui/NavigationHeader';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/notes');
      if (!response.ok) {
        throw new Error('Gagal mengambil catatan. Silakan coba lagi.');
      }
      const data = await response.json();
      setNotes(data.data);
      setFilteredNotes(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const results = notes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredNotes(results);
  }, [searchTerm, notes]);

  const handleOpenModal = (note = null) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedNote(null);
    setIsModalOpen(false);
  };

  const handleSaveNote = async () => {
    await fetchNotes(); // Re-fetch notes to get the latest data
    handleCloseModal();
  };

  const handleDeleteNote = async (id) => {
    try {
      const response = await authFetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Gagal menghapus catatan.');
      }
      await fetchNotes(); // Re-fetch notes
    } catch (err) {
      setError(err.message);
      // Optionally, show a notification to the user
    }
  };

  return (
    <div className="container mx-auto p-4 pt-24">
      <NavigationHeader title="Catatan Saya" />
      
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Cari catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={18} />
          Tambah Catatan
        </Button>
      </div>

      {loading && <p className="text-center">Memuat...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onEdit={() => handleOpenModal(note)} 
                onDelete={() => handleDeleteNote(note.id)}
              />
            ))
          ) : (
            <p className="text-center col-span-full">Tidak ada catatan ditemukan.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <NoteFormModal
          note={selectedNote}
          onClose={handleCloseModal}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
};

export default NotesPage;
