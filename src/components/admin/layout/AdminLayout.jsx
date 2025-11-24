import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import OwnerSidebar from './OwnerSidebar'; // Import OwnerSidebar
import Header from './Header';
import OwnerHeader from './OwnerHeader'; // Import OwnerHeader
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { headerTitle } = useAppSettings();
  const [userRole, setUserRole] = useState(null); // Add userRole state

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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
