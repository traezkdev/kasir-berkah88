import React, { useState, useEffect } from 'react';
import MobileChat from './MobileChat';
import DesktopChat from './DesktopChat';

const CustomerChat = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <MobileChat /> : <DesktopChat />;
};

export default CustomerChat;
