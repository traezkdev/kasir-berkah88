import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('siakad_token');
    const user = JSON.parse(localStorage.getItem('siakad_user') || 'null');

    // Jika tidak ada token, arahkan ke login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Jika ada proteksi role, cek rolenya cocok atau tidak
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Jika role tidak cocok, arahkan ke dashboard default masing-masing
        if (user?.role === 'admin') return <Navigate to="/" replace />;
        if (user?.role === 'guru') return <Navigate to="/guru/dashboard" replace />;
        return <Navigate to="/siswa/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
