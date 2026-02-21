import React, { useState, useEffect } from 'react';
import MobileOrderConfirmation from './MobileOrderConfirmation';
import DesktopOrderConfirmation from './DesktopOrderConfirmation';

const CustomerOrderConfirmation = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileOrderConfirmation /> : <DesktopOrderConfirmation />;
};

export default CustomerOrderConfirmation;
