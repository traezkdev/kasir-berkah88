import React, { useState, useEffect } from 'react';
import DesktopGuestCheckout from './DesktopGuestCheckout';
import MobileGuestCheckout from './MobileGuestCheckout';

const GuestCheckout = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileGuestCheckout /> : <DesktopGuestCheckout />;
};

export default GuestCheckout;
