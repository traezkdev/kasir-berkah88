import { useState, useEffect } from 'react';
import { API_URL } from '../api/apiService';

const usePopups = (currentPage) => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPopups();
    }, [currentPage]);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/popups/active?page=${currentPage}`);
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
