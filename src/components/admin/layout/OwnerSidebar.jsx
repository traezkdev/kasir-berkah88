import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaUser, FaSignOutAlt, FaAngleDoubleLeft, FaAngleDoubleRight
} from 'react-icons/fa';

// Component untuk menu item dengan tooltip - Dipindah ke luar agar tidak re-mount setiap render
const MenuItem = ({ to, icon: Icon, children, onClick, isCollapsed, handleMouseEnter, handleMouseLeave, navLinkClasses, activeLinkClasses }) => (
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

const OwnerSidebar = ({ isOpen, toggleSidebar, headerTitle }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    return savedState === 'true';
  });

  // Simpan ke localStorage setiap kali state berubah
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  // Ref untuk tooltip (No Re-render)
  const tooltipRef = useRef(null);
  const tooltipTextRef = useRef(null);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navLinkClasses = `flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-6 py-3'} w-full text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-gray-700 hover:text-white group relative z-10 ${isCollapsed ? '' : 'border-l-4 border-transparent hover:border-gray-500'}`;
  const activeLinkClasses = `bg-gray-700 text-white ${isCollapsed ? '' : 'border-l-4 border-white'}`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${isCollapsed ? 'w-20' : 'w-64'} bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col h-screen`}>
        <div className={`flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center mx-2' : 'justify-between px-4'} h-20 border-b border-gray-700`}>
          {!isCollapsed && <h1 className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{headerTitle}</h1>}
          {isCollapsed && <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-xl">O</span></div>}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors ${isCollapsed ? 'absolute -right-3 top-7 bg-gray-800 border border-gray-600 shadow-sm z-50 rounded-full w-6 h-6 items-center justify-center p-0' : 'ml-2'}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <FaAngleDoubleRight className="text-xs" /> : <FaAngleDoubleLeft className="text-lg" />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <MenuItem
            to="/owner-dashboard"
            icon={FaTachometerAlt}
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            isCollapsed={isCollapsed}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            navLinkClasses={navLinkClasses}
            activeLinkClasses={activeLinkClasses}
          >
            Dashboard Owner
          </MenuItem>
          <MenuItem
            to="/profile"
            icon={FaUser}
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            isCollapsed={isCollapsed}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            navLinkClasses={navLinkClasses}
            activeLinkClasses={activeLinkClasses}
          >
            Profil
          </MenuItem>
        </nav>
        <div className="px-2 py-4 border-t border-gray-700">
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
        className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-150 opacity-0 invisible"
        style={{ top: 0, left: 0 }}
      >
        <span ref={tooltipTextRef}></span>
        {/* Arrow */}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
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

export default OwnerSidebar;