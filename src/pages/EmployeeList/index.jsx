import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import AppImage from '../../components/AppImage';
import Icon from '../../components/AppIcon';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const EmployeeCard = ({ employee }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <AppImage src={`${apiUrl}${employee.avatar}`} alt={employee.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
        <h3 className="text-xl font-bold">{employee.name}</h3>
        <p className="text-gray-500">{employee.position}</p>
        <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center text-gray-600">
                <Icon name="Phone" size={16} className="mr-2" />
                <span>{employee.phone}</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
                <Icon name="Mail" size={16} className="mr-2" />
                <span>{employee.email}</span>
            </div>
        </div>
    </div>
);

const EmployeeListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await authFetch(`${apiUrl}/api/employees`);
                const data = await response.json();
                if (response.ok) {
                    setEmployees(data.data);
                } else {
                    setError(data.error || 'Failed to fetch employees');
                }
            } catch (err) {
                setError('Network error or server unreachable');
                console.error('Fetch employees error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4 pt-24 pb-32">
            <NavigationHeader title="Struktur Organisasi" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {employees.map(employee => (
                    <EmployeeCard key={employee.id} employee={employee} />
                ))}
            </div>
        </div>
    );
};

export default EmployeeListPage;