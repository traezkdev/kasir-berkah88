import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { headerTitle } = useAppSettings();

  useEffect(() => {
    document.body.classList.add('admin-no-scroll');
    return () => {
      document.body.classList.remove('admin-no-scroll');
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} headerTitle={headerTitle} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
