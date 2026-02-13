import { useState, useEffect } from 'react';
import { API_URL } from '../api/apiService';
import { useOrderNotification } from '../context/OrderNotificationContext';

const usePopups = (currentPage) => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { socket } = useOrderNotification();

    useEffect(() => {
        fetchPopups();

        if (socket) {
            const handlePush = () => {
                console.log("Popup pushed! Refetching...");
                fetchPopups();
            };
            socket.on('popup_push', handlePush);
            return () => {
                socket.off('popup_push', handlePush);
            };
        }
    }, [currentPage, socket]);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            // Add timestamp to prevent caching
            const response = await fetch(`${API_URL}/api/popups/active?page=${currentPage}&t=${Date.now()}`);
            const data = await response.json();

            if (data.message === 'success') {
                setPopups(data.data || []);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching popups:', err);
            setError(err.message);
            setPopups([]);
        } finally {
            setLoading(false);
        }
    };

    return { popups, loading, error, refetch: fetchPopups };
};

export default usePopups;
