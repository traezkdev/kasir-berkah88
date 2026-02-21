import React, { useState, useEffect } from 'react';
import MobileMenu from './MobileMenu';
import DesktopMenu from './DesktopMenu';

const CustomerMenu = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileMenu /> : <DesktopMenu />;
};

export default CustomerMenu;
