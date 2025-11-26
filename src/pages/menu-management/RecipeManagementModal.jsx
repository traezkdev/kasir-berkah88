import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authFetch from '../../utils/authFetch';
import { FaTrash, FaPlus } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const RecipeManagementModal = ({ isOpen, onClose, menuItem, showMessage, showError }) => {
  const [recipes, setRecipes] = useState([]);
  const [allRawMaterials, setAllRawMaterials] = useState([]);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecipes = useCallback(async () => {
    if (!menuItem) return;
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/menu-recipes/${menuItem.id}`);
      const data = await response.json();
      if (response.ok) {
        setRecipes(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat resep');
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [menuItem, showError]);

  const fetchAllRawMaterials = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/raw-materials`);
      const data = await response.json();
      if (response.ok) {
        setAllRawMaterials(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat bahan mentah');
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
      fetchAllRawMaterials();
    }
  }, [isOpen, fetchRecipes, fetchAllRawMaterials]);

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!selectedRawMaterial || !quantity || quantity <= 0) {
      showError("Pilih bahan mentah dan masukkan kuantitas yang valid.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/menu-recipes`, {
        menu_item_id: menuItem.id,
        raw_material_id: selectedRawMaterial,
        quantity: quantity,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('Bahan berhasil ditambahkan ke resep.');
      fetchRecipes(); // Refresh the list
      setSelectedRawMaterial('');
      setQuantity(1);
    } catch (err) {
      showError(err.response?.data?.error || "Gagal menambahkan bahan ke resep.");
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm("Anda yakin ingin menghapus bahan ini dari resep?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/menu-recipes/${recipeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('Bahan berhasil dihapus dari resep.');
        fetchRecipes(); // Refresh the list
      } catch (err) {
        showError(err.response?.data?.error || "Gagal menghapus bahan dari resep.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Kelola Resep: {menuItem?.name}</h2>
        
        {loading && <p>Memuat...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="mb-4 border-t pt-4">
          <h3 className="font-semibold mb-2">Bahan yang Dibutuhkan</h3>
          {recipes.length > 0 ? (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {recipes.map(recipe => (
                <li key={recipe.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span>{recipe.raw_material_name} - <strong>{recipe.quantity}</strong> {recipe.unit}</span>
                  <button onClick={() => handleDeleteRecipe(recipe.id)} className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Belum ada bahan yang ditambahkan.</p>
          )}
        </div>

        <form onSubmit={handleAddRecipe} className="border-t pt-4">
          <h3 className="font-semibold mb-2">Tambah Bahan Baru</h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedRawMaterial}
              onChange={(e) => setSelectedRawMaterial(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">-- Pilih Bahan Mentah --</option>
              {allRawMaterials.map(material => (
                <option key={material.id} value={material.id}>{material.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
              className="shadow border rounded w-32 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              <FaPlus />
            </button>
          </div>
        </form>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeManagementModal;
