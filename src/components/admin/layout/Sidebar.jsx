import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaChartLine,
  FaUsers, FaCog, FaFileInvoiceDollar, FaCalculator, FaBook, FaSignOutAlt
} from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar, headerTitle }) => {
  const navLinkClasses = "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <NavLink to="/main-dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaTachometerAlt className="mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/menu-management" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBoxOpen className="mr-3" />
            Manajemen Menu
          </NavLink>
          <NavLink to="/transaction-history" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaClipboardList className="mr-3" />
            Riwayat Transaksi
          </NavLink>
          <NavLink to="/order-confirmation" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaClipboardList className="mr-3" />
            Konfirmasi Pesanan
          </NavLink>
          <NavLink to="/sales-transaction-processing" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileInvoiceDollar className="mr-3" />
            Proses Transaksi Penjualan
          </NavLink>
          <NavLink to="/business-reports" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaChartLine className="mr-3" />
            Laporan Bisnis
          </NavLink>
          <NavLink to="/employee-list" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaUsers className="mr-3" />
            Daftar Karyawan
          </NavLink>
          <NavLink to="/expense-tracking" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileInvoiceDollar className="mr-3" />
            Catatan Pengeluaran
          </NavLink>
          <NavLink to="/lapak-deposit" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaFileInvoiceDollar className="mr-3" />
            Pengeluaran Lapak
          </NavLink>
          <NavLink to="/raw-material-stock" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBoxOpen className="mr-3" /> {/* Menggunakan FaBoxOpen karena FaBoxes tidak terdaftar */}
            Stok Bahan Mentah
          </NavLink>
          <NavLink to="/hpp" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCalculator className="mr-3" />
            Perhitungan HPP
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaBook className="mr-3" />
            Catatan
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={toggleSidebar}>
            <FaCog className="mr-3" />
            Pengaturan
          </NavLink>
        </nav>
        <div className="px-2 py-4 border-t border-gray-700">
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