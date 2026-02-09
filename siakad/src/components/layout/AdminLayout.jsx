import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Determine role based on path
    const role = location.pathname.startsWith('/siswa') ? 'siswa' :
        location.pathname.startsWith('/guru') ? 'guru' : 'admin';

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#111827] text-gray-900 dark:text-gray-100 style-elegant">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} role={role} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A] py-4 sm:py-6 lg:py-8">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
