import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaChartLine,
  FaUsers, FaCog, FaFileInvoiceDollar, FaCalculator, FaBook, FaSignOutAlt, FaRobot,
  FaCashRegister, FaExclamationTriangle, FaTrashAlt, FaWallet, FaBalanceScale,
  FaFileAlt, FaHandHoldingUsd, FaUserCircle, FaHistory, FaCheckCircle
} from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar, headerTitle }) => {
  const navLinkClasses = "flex items-center px-4 py-3 mx-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group";
  const activeLinkClasses = "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800";

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 flex flex-col h-screen`}>
        <div className="flex-shrink-0 flex items-center justify-center h-20 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{headerTitle}</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          <NavLink to="/main-dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaTachometerAlt className="mr-3" />
            Dashboard
          </NavLink>

          {/* Grup Penjualan */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Penjualan</div>
          <NavLink to="/sales-transaction-processing" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileInvoiceDollar className="mr-3" />
            Proses Transaksi
          </NavLink>
          <NavLink to="/transaksi-sederhana" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCashRegister className="mr-3" />
            Transaksi Sederhana
          </NavLink>
          <NavLink to="/order-confirmation" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCheckCircle className="mr-3" />
            Konfirmasi Pesanan
          </NavLink>

          {/* Grup Inventaris */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventaris</div>
          <NavLink to="/menu-management" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBoxOpen className="mr-3" />
            Manajemen Menu
          </NavLink>
          <NavLink to="/raw-material-stock" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBoxOpen className="mr-3" />
            Stok Bahan Mentah
          </NavLink>
          <NavLink to="/main-critical-stock" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaExclamationTriangle className="mr-3" />
            Stok Menipis
          </NavLink>

          {/* Grup Keuangan */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Keuangan</div>
          <NavLink to="/expense-tracking" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileInvoiceDollar className="mr-3" />
            Pengeluaran Operasional
          </NavLink>
          <NavLink to="/lapak-deposit" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaWallet className="mr-3" />
            Pengeluaran Lapak
          </NavLink>
          <NavLink to="/admin-uang-bisnis" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaWallet className="mr-3" />
            Uang Bisnis
          </NavLink>
          <NavLink to="/cash-reconciliation" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBalanceScale className="mr-3" />
            Rekonsiliasi Kas
          </NavLink>

          {/* Grup Riwayat & Laporan */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Laporan</div>
          <NavLink to="/transaction-history" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaHistory className="mr-3" />
            Riwayat Transaksi
          </NavLink>
          <NavLink to="/transaction-trash" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaTrashAlt className="mr-3" />
            Sampah Transaksi
          </NavLink>
          <NavLink to="/laporan" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaChartLine className="mr-3" />
            Laporan Bisnis
          </NavLink>
          <NavLink to="/laporan-lengkap" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileAlt className="mr-3" />
            Laporan Lengkap
          </NavLink>

          {/* Grup Alat & Personalia */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alat & SDM</div>
          <NavLink to="/hpp" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCalculator className="mr-3" />
            Perhitungan HPP
          </NavLink>
          <NavLink to="/calculator" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCalculator className="mr-3" />
            Kalkulator Cepat
          </NavLink>
          <NavLink to="/chatbot" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaRobot className="mr-3" />
            AI Assistant
          </NavLink>
          <NavLink to="/employee-list" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaUsers className="mr-3" />
            Daftar Karyawan
          </NavLink>
          <NavLink to="/credits" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaHandHoldingUsd className="mr-3" />
            Kredit / Piutang
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBook className="mr-3" />
            Catatan
          </NavLink>

          {/* Grup Akun */}
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sistem</div>
          <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaUserCircle className="mr-3" />
            Profil Saya
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCog className="mr-3" />
            Pengaturan
          </NavLink>
        </nav>
        <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button className={`${navLinkClasses} w-full`}>
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
