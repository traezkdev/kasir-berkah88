import React from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import AppImage from '../../components/AppImage';
import Icon from '../../components/AppIcon';

// Dummy data for employees
const employees = [
    {
        id: 1,
        name: 'Alfin',
        position: 'Owner',
        avatar: '/assets/images/logoberkah88.png',
        phone: '0858-xxxx-xxxx',
        email: 'alfin@example.com',
        social: {
            linkedin: '#',
            twitter: '#',
        }
    },
    {
        id: 2,
        name: 'Karyawan 1',
        position: 'Kasir',
        avatar: '/assets/images/no_image.png',
        phone: '0812-xxxx-xxxx',
        email: 'karyawan1@example.com',
        social: {
            linkedin: '#',
            twitter: '#',
        }
    },
    {
        id: 3,
        name: 'Karyawan 2',
        position: 'Koki',
        avatar: '/assets/images/no_image.png',
        phone: '0813-xxxx-xxxx',
        email: 'karyawan2@example.com',
        social: {
            linkedin: '#',
            twitter: '#',
        }
    },
];

const EmployeeCard = ({ employee }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <AppImage src={employee.avatar} alt={employee.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
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
        <div className="mt-4 flex justify-center space-x-4">
            <a href={employee.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
                <Icon name="Linkedin" size={20} />
            </a>
            <a href={employee.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                <Icon name="Twitter" size={20} />
            </a>
        </div>
    </div>
);

const EmployeeListPage = () => {
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
