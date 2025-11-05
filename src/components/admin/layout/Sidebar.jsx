import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaChartLine,
  FaUsers, FaCog, FaFileInvoiceDollar, FaCalculator, FaBook, FaSignOutAlt
} from 'react-icons/fa';
import AppIcon from '../../AppIcon'; // Assuming AppIcon can render the logo

const Sidebar = () => {
  const navLinkClasses = "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        {/* <AppIcon src="assets/images/logoberkah88.png" alt="Logo" className="h-10 w-auto" /> */}
        <h1 className="text-2xl font-bold">Berkah 88</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink to="/main-dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaTachometerAlt className="mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/menu-management" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaBoxOpen className="mr-3" />
          Manajemen Menu
        </NavLink>
        <NavLink to="/transaction-history" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaClipboardList className="mr-3" />
          Riwayat Transaksi
        </NavLink>
        <NavLink to="/business-reports" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaChartLine className="mr-3" />
          Laporan Bisnis
        </NavLink>
        <NavLink to="/employee-list" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaUsers className="mr-3" />
          Daftar Karyawan
        </NavLink>
        <NavLink to="/expense-tracking" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaFileInvoiceDollar className="mr-3" />
          Catatan Pengeluaran
        </NavLink>
        <NavLink to="/hpp" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaCalculator className="mr-3" />
          Perhitungan HPP
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <FaBook className="mr-3" />
          Catatan
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
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
  );
};

export default Sidebar;