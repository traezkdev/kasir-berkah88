import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import OwnerSidebar from './OwnerSidebar'; // Import OwnerSidebar
import Header from './Header';
import OwnerHeader from './OwnerHeader'; // Import OwnerHeader
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { headerTitle } = useAppSettings();
  const [userRole, setUserRole] = useState(null); // Add userRole state

  // List of paths that should not have default padding
  const fullWidthPaths = ['/transaksi', '/transaksi-sederhana'];
  const isFullWidth = fullWidthPaths.includes(location.pathname);

  // List of paths that should not have internal scroll in the main layout
  const noScrollPaths = ['/transaksi-sederhana'];
  const isNoScroll = noScrollPaths.includes(location.pathname);

  useEffect(() => {
    document.body.classList.add('admin-no-scroll');
    return () => {
      document.body.classList.remove('admin-no-scroll');
    };
  }, []);

  useEffect(() => { // Add useEffect to get user role
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role);
      } catch (e) {
        console.error("Error decoding token in AdminLayout:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {userRole === 'owner' ? (
        <OwnerSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} headerTitle={headerTitle} />
      ) : (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} headerTitle={headerTitle} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {userRole === 'owner' ? (
          <OwnerHeader toggleSidebar={toggleSidebar} />
        ) : (
          <Header toggleSidebar={toggleSidebar} />
        )}
        <main className={`flex-1 overflow-x-hidden ${isNoScroll ? 'overflow-y-hidden' : 'overflow-y-auto'} bg-background ${isFullWidth ? '' : 'p-4 sm:p-6'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
