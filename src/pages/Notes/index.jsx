import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';

import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NoteFormModal from './components/NoteFormModal';
import ViewNoteModal from './components/ViewNoteModal'; // Import the new modal
import NoteCard from './components/NoteCard';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import { useTheme } from '../../contexts/ThemeContext';

const NotesPage = () => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State for view modal
  const [noteToView, setNoteToView] = useState(null); // State for note to view
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);
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

  const handleOpenFormModal = (note = null) => {
    setSelectedNote(note);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setSelectedNote(null);
    setIsFormModalOpen(false);
  };

  const handleOpenViewModal = (note) => {
    setNoteToView(note);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setNoteToView(null);
    setIsViewModalOpen(false);
  };

  const handleSaveNote = async () => {
    await fetchNotes(); // Re-fetch notes to get the latest data
    handleCloseFormModal();
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
    <div className={`container mx-auto p-4 pb-32 ${theme === 'default' ? 'pt-24' : ''}`}>
      {theme === 'default' && <NavigationHeader title="Catatan Saya" />}
      <BreadcrumbNavigation className="mb-4" />
      
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
        <Button onClick={() => handleOpenFormModal()} className="flex items-center gap-2">
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
                currentUserId={currentUserId}
                onView={() => handleOpenViewModal(note)} // Pass the handler
                onEdit={() => handleOpenFormModal(note)} 
                onDelete={() => handleDeleteNote(note.id)}
              />
            ))
          ) : (
            <p className="text-center col-span-full">Tidak ada catatan ditemukan.</p>
          )}
        </div>
      )}

      {isFormModalOpen && (
        <NoteFormModal
          note={selectedNote}
          onClose={handleCloseFormModal}
          onSave={handleSaveNote}
        />
      )}

      {isViewModalOpen && (
        <ViewNoteModal
          note={noteToView}
          onClose={handleCloseViewModal}
        />
      )}
    </div>
  );
};

export default NotesPage;
