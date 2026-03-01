import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Determine role based on path
    const role = location.pathname.startsWith('/siswa') ? 'siswa' :
        location.pathname.startsWith('/guru') ? 'guru' : 'admin';

    const [headerName, setHeaderName] = useState('Sistem Informasi Akademik');
    const [sidebarName, setSidebarName] = useState('SIAS PRO');

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const response = await fetch(`${apiUrl}/api/settings`);
                const data = await response.json();
                if (response.ok) {
                    if (data.header_name) setHeaderName(data.header_name);
                    if (data.sidebar_name) setSidebarName(data.sidebar_name);
                }
            } catch (err) {
                console.error("Gagal memuat Site Name");
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#111827] text-gray-900 dark:text-gray-100 style-elegant">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} role={role} sidebarName={sidebarName} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} headerName={headerName} role={role} />

                <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A] ${location.pathname.includes('/profile') || location.pathname.includes('/admin/settings') ? '' : 'py-4 sm:py-6 lg:py-8 px-3 sm:px-6'}`}>
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
