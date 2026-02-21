import React, { useState, useEffect } from 'react';
import MobileCart from './MobileCart';
import DesktopCart from './DesktopCart';

const CustomerCart = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileCart /> : <DesktopCart />;
};

export default CustomerCart;
