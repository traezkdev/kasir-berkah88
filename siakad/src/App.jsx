import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import GuruDashboard from './pages/GuruDashboard';
import SiswaDashboard from './pages/SiswaDashboard';
import SiswaAbsensi from './pages/SiswaAbsensi';
import PresensiSiswa from './pages/PresensiSiswa';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import DataSiswa from './pages/DataSiswa';
import DataGuru from './pages/DataGuru';
import DataMapel from './pages/DataMapel';
import DataJadwal from './pages/DataJadwal';
import DataKelas from './pages/DataKelas';
import AdminSettings from './pages/AdminSettings';

import DataNilai from './pages/DataNilai';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth Routes (No Sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main App Routes (With Sidebar & Protection) */}
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* Admin Section */}
          <Route index element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/siswa" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataSiswa />
            </ProtectedRoute>
          } />
          <Route path="admin/guru" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataGuru />
            </ProtectedRoute>
          } />
          <Route path="admin/mapel" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataMapel />
            </ProtectedRoute>
          } />
          <Route path="admin/jadwal" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataJadwal />
            </ProtectedRoute>
          } />
          <Route path="admin/nilai" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataNilai />
            </ProtectedRoute>
          } />
          <Route path="admin/kelas" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataKelas />
            </ProtectedRoute>
          } />
          <Route path="admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } />

          {/* Guru Section */}
          <Route path="guru/dashboard" element={
            <ProtectedRoute allowedRoles={['guru', 'admin']}>
              <GuruDashboard />
            </ProtectedRoute>
          } />
          <Route path="guru/jadwal" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Jadwal Pelajaran</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="guru/presensi" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <PresensiSiswa />
            </ProtectedRoute>
          } />
          <Route path="guru/materi" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Materi & Tugas</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="guru/nilai-harian" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Nilai Harian</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="guru/nilai-rapor" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">E-Rapor</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="guru/wali-kelas" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Manajemen Wali Kelas</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="guru/settings" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Pengaturan Guru</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />

          {/* Siswa Section */}
          <Route path="siswa/dashboard" element={
            <ProtectedRoute allowedRoles={['siswa', 'admin']}>
              <SiswaDashboard />
            </ProtectedRoute>
          } />
          <Route path="siswa/jadwal" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Jadwal Pelajaran</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="siswa/absensi" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <SiswaAbsensi />
            </ProtectedRoute>
          } />
          <Route path="siswa/nilai" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Nilai & Rapor</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="siswa/materi" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Materi Belajar</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="siswa/pembayaran" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Pembayaran SPP</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
          <Route path="siswa/settings" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Pengaturan Siswa</h2><p>Halaman dalam pengembangan</p></div>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
