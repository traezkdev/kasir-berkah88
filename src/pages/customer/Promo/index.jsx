import React, { useState, useEffect } from 'react';
import MobilePromo from './MobilePromo';
import DesktopPromo from './DesktopPromo';

const CustomerPromo = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobilePromo /> : <DesktopPromo />;
};

export default CustomerPromo;
