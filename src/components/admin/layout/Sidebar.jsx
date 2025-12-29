import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaChartLine,
  FaUsers, FaCog, FaFileInvoiceDollar, FaCalculator, FaBook, FaSignOutAlt, FaRobot,
  FaCashRegister, FaExclamationTriangle, FaTrashAlt, FaWallet, FaBalanceScale,
  FaFileAlt, FaHandHoldingUsd, FaUserCircle, FaHistory, FaCheckCircle, FaBars, FaAngleDoubleLeft, FaAngleDoubleRight
} from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar, headerTitle }) => {
  const navigate = useNavigate();
  // Inisialisasi state dari localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    return savedState === 'true';
  });

  // Simpan ke localStorage setiap kali state berubah
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  // Ref untuk tooltip elemen (menghindari re-render React saat hover)
  const tooltipRef = useRef(null);
  const tooltipTextRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navLinkClasses = `flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-6 py-3'} w-full text-sm font-medium text-gray-600 dark:text-gray-300 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group relative z-10 ${isCollapsed ? '' : 'border-l-4 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`;
  const activeLinkClasses = `bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 ${isCollapsed ? '' : 'border-l-4 border-indigo-600 dark:border-indigo-400'}`;
  const groupTitleClasses = `px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`;

  // Handler native JS untuk performa hover terbaik tanpa re-render component
  const handleMouseEnter = (e, content) => {
    if (!isCollapsed || !tooltipRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tooltip = tooltipRef.current;

    // Set konten text
    if (tooltipTextRef.current) {
      tooltipTextRef.current.textContent = content;
    }

    // Set posisi
    tooltip.style.top = `${rect.top + (rect.height / 2)}px`;
    tooltip.style.left = `${rect.right}px`;
    tooltip.style.transform = 'translateY(-50%)';
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  };

  const handleMouseLeave = () => {
    if (!tooltipRef.current) return;
    tooltipRef.current.style.opacity = '0';
    tooltipRef.current.style.visibility = 'hidden';
  };

  // Component untuk menu item
  const MenuItem = ({ to, icon: Icon, children, onClick }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => handleMouseEnter(e, children)}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className={`${isCollapsed ? '' : 'mr-3'} text-lg flex-shrink-0 transition-transform group-hover:scale-110`} />
      {!isCollapsed && <span>{children}</span>}
    </NavLink>
  );

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col h-screen`}>
        <div className={`flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center mx-2' : 'justify-between px-4'} h-20 border-b border-gray-100 dark:border-gray-700`}>
          {!isCollapsed && <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap overflow-hidden text-ellipsis">{headerTitle}</h1>}
          {isCollapsed && <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-indigo-700 dark:text-indigo-400 font-bold text-xl">B</span></div>}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors ${isCollapsed ? 'absolute -right-3 top-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm z-50 rounded-full w-6 h-6 items-center justify-center p-0' : 'ml-2'}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <FaAngleDoubleRight className="text-xs" /> : <FaAngleDoubleLeft className="text-lg" />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <MenuItem to="/main-dashboard" icon={FaTachometerAlt} onClick={toggleSidebar}>
            Dashboard
          </MenuItem>

          {/* Grup Penjualan */}
          {!isCollapsed && <div className={groupTitleClasses}>Penjualan</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/transaksi" icon={FaFileInvoiceDollar} onClick={toggleSidebar}>
            Proses Transaksi
          </MenuItem>
          <MenuItem to="/transaksi-sederhana" icon={FaCashRegister} onClick={toggleSidebar}>
            Transaksi Sederhana
          </MenuItem>
          <MenuItem to="/order-confirmation" icon={FaCheckCircle} onClick={toggleSidebar}>
            Konfirmasi Pesanan
          </MenuItem>

          {/* Grup Inventaris */}
          {!isCollapsed && <div className={groupTitleClasses}>Inventaris</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/menu-management" icon={FaBoxOpen} onClick={toggleSidebar}>
            Manajemen Menu
          </MenuItem>
          <MenuItem to="/raw-material-stock" icon={FaBoxOpen} onClick={toggleSidebar}>
            Stok Bahan Mentah
          </MenuItem>
          <MenuItem to="/main-critical-stock" icon={FaExclamationTriangle} onClick={toggleSidebar}>
            Stok Menipis
          </MenuItem>

          {/* Grup Keuangan */}
          {!isCollapsed && <div className={groupTitleClasses}>Keuangan</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/expense-tracking" icon={FaFileInvoiceDollar} onClick={toggleSidebar}>
            Pengeluaran Operasional
          </MenuItem>
          <MenuItem to="/lapak-deposit" icon={FaWallet} onClick={toggleSidebar}>
            Pengeluaran Lapak
          </MenuItem>
          <MenuItem to="/admin-uang-bisnis" icon={FaWallet} onClick={toggleSidebar}>
            Uang Bisnis
          </MenuItem>
          <MenuItem to="/cash-reconciliation" icon={FaBalanceScale} onClick={toggleSidebar}>
            Rekonsiliasi Kas
          </MenuItem>

          {/* Grup Riwayat & Laporan */}
          {!isCollapsed && <div className={groupTitleClasses}>Laporan</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/transaction-history" icon={FaHistory} onClick={toggleSidebar}>
            Riwayat Transaksi
          </MenuItem>
          <MenuItem to="/transaction-trash" icon={FaTrashAlt} onClick={toggleSidebar}>
            Sampah Transaksi
          </MenuItem>
          <MenuItem to="/laporan" icon={FaChartLine} onClick={toggleSidebar}>
            Laporan Bisnis
          </MenuItem>
          <MenuItem to="/laporan-lengkap" icon={FaFileAlt} onClick={toggleSidebar}>
            Laporan Lengkap
          </MenuItem>

          {/* Grup Alat & Personalia */}
          {!isCollapsed && <div className={groupTitleClasses}>Alat & SDM</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/hpp" icon={FaCalculator} onClick={toggleSidebar}>
            Perhitungan HPP
          </MenuItem>
          <MenuItem to="/calculator" icon={FaCalculator} onClick={toggleSidebar}>
            Kalkulator Cepat
          </MenuItem>
          <MenuItem to="/chatbot" icon={FaRobot} onClick={toggleSidebar}>
            AI Assistant
          </MenuItem>
          <MenuItem to="/employee-list" icon={FaUsers} onClick={toggleSidebar}>
            Daftar Karyawan
          </MenuItem>
          <MenuItem to="/credits" icon={FaHandHoldingUsd} onClick={toggleSidebar}>
            Kredit / Piutang
          </MenuItem>
          <MenuItem to="/notes" icon={FaBook} onClick={toggleSidebar}>
            Catatan
          </MenuItem>

          {/* Grup Akun */}
          {!isCollapsed && <div className={groupTitleClasses}>Sistem</div>}
          {isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>}
          <MenuItem to="/profile" icon={FaUserCircle} onClick={toggleSidebar}>
            Profil Saya
          </MenuItem>
          <MenuItem to="/settings" icon={FaCog} onClick={toggleSidebar}>
            Pengaturan
          </MenuItem>
        </nav>
        <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={handleLogout}
            className={`${navLinkClasses} w-full relative group`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Logout')}
            onMouseLeave={handleMouseLeave}
          >
            <FaSignOutAlt className={`${isCollapsed ? '' : 'mr-3'} text-lg flex-shrink-0`} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Floating Tooltip - Menggunakan Ref untuk manipulasi DOM langsung tanpa re-render */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-150 opacity-0 invisible"
        style={{ top: 0, left: 0 }}
      >
        <span ref={tooltipTextRef}></span>
        {/* Arrow */}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
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
