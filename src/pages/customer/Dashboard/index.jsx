import React, { useState, useEffect } from 'react';
import MobileDashboard from './MobileDashboard';
import DesktopDashboard from './DesktopDashboard';

const CustomerDashboard = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
};

export default CustomerDashboard;
