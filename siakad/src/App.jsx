import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import GuruDashboard from './pages/guru/Dashboard';
import SiswaDashboard from './pages/siswa/Dashboard';
import SiswaAbsensi from './pages/siswa/SiswaAbsensi';
import PresensiSiswa from './pages/guru/PresensiSiswa';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import DataSiswa from './pages/admin/DataSiswa';
import DataGuru from './pages/admin/DataGuru';
import DataMapel from './pages/admin/DataMapel';
import DataJadwal from './pages/admin/DataJadwal';
import DataKelas from './pages/admin/DataKelas';
import AdminSettings from './pages/admin/AdminSettings';
import DataAgenda from './pages/admin/DataAgenda';

import DataNilai from './pages/admin/DataNilai';

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
          <Route path="admin/agenda" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DataAgenda />
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
