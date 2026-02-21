import React, { useState, useEffect } from 'react';
import MobilePointsHistory from './MobilePointsHistory';
import DesktopPointsHistory from './DesktopPointsHistory';

const PointsHistory = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobilePointsHistory /> : <DesktopPointsHistory />;
};

export default PointsHistory;
