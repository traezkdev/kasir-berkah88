import React, { useState } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Button from '../../components/ui/Button';

const CalculatorPage = () => {
    const [expression, setExpression] = useState('');
    const [displayValue, setDisplayValue] = useState('');
    const [result, setResult] = useState('');

    const formatRupiah = (angka) => {
        if (!angka) return '';
        let number_string = angka.replace(/[^,\d]/g, '').toString();
        let split = number_string.split(',');
        let sisa = split[0].length % 3;
        let rupiah = split[0].substr(0, sisa);
        let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

        if (ribuan) {
            let separator = sisa ? '.' : '';
            rupiah += separator + ribuan.join('.');
        }

        rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
        return rupiah;
    };

    const formatExpression = (expr) => {
        if (!expr) return '';
        const parts = expr.split(/([+\-*/])/); // Memecah berdasarkan operator
        const formattedParts = parts.map(part => {
            if (!isNaN(part) && part !== '') { // Jika bagian adalah angka
                return formatRupiah(part);
            }
            return part; // Jika operator atau string kosong
        });
        return formattedParts.join('');
    };

    const handleButtonClick = (value) => {
        if (value === '=') {
            try {
                const calculatedResult = eval(expression).toString();
                setResult(calculatedResult);
                setExpression(calculatedResult);
                setDisplayValue(formatRupiah(calculatedResult));
            } catch (error) {
                setResult('Error');
                setExpression('');
                setDisplayValue('Error');
            }
        } else if (value === 'C') {
            setExpression('');
            setResult('');
            setDisplayValue('');
        } else if (value === 'DEL') {
            setExpression(prevExpression => {
                const newExpression = prevExpression.slice(0, -1);
                setDisplayValue(formatExpression(newExpression));
                return newExpression;
            });
        } else {
            setExpression(prevExpression => {
                const newExpression = prevExpression + value;
                setDisplayValue(formatExpression(newExpression));
                return newExpression;
            });
        }
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+',
        'DEL', 'C'
    ];

    return (
        <div className="container mx-auto p-4 pt-24 pb-32">
            <NavigationHeader title="Kalkulator" />
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto">
                <div className="bg-gray-100 rounded-lg p-4 mb-4 text-right min-h-[6rem]">
                    <div className="text-gray-500 text-lg">{displayValue}</div>
                    <div className="text-black text-3xl font-bold">{formatRupiah(result)}</div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {buttons.map((btn) => (
                        <Button
                            key={btn}
                            onClick={() => handleButtonClick(btn)}
                            className={`text-2xl ${btn === 'C' || btn === 'DEL' ? 'col-span-2' : ''} ${btn === 'C' ? 'bg-red-500 hover:bg-red-600' : ''} ${btn === '=' ? 'bg-green-500 hover:bg-green-600' : ''} ${btn === 'DEL' ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
                        >
                            {btn}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;
