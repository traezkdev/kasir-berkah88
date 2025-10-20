import React, { useState } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Button from '../../components/ui/Button';

const CalculatorPage = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const handleButtonClick = (value) => {
        if (value === '=') {
            try {
                setResult(eval(input).toString());
            } catch (error) {
                setResult('Error');
            }
        } else if (value === 'C') {
            setInput('');
            setResult('');
        } else {
            setInput(prevInput => prevInput + value);
        }
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+',
        'C'
    ];

    return (
        <div className="container mx-auto p-4 pt-24 pb-32">
            <NavigationHeader title="Kalkulator" />
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto">
                <div className="bg-gray-100 rounded-lg p-4 mb-4 text-right">
                    <div className="text-gray-500 text-lg">{input}</div>
                    <div className="text-black text-3xl font-bold">{result}</div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {buttons.map((btn) => (
                        <Button
                            key={btn}
                            onClick={() => handleButtonClick(btn)}
                            className={`text-2xl ${btn === 'C' || btn === '=' ? 'col-span-1' : ''} ${btn === 'C' ? 'bg-red-500 hover:bg-red-600' : ''} ${btn === '=' ? 'bg-green-500 hover:bg-green-600' : ''}`}
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
