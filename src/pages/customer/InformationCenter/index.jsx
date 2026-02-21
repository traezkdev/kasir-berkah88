import React, { useState, useEffect } from 'react';
import MobileInformationCenter from './MobileInformationCenter';
import DesktopInformationCenter from './DesktopInformationCenter';

const InformationCenter = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileInformationCenter /> : <DesktopInformationCenter />;
};

export default InformationCenter;
