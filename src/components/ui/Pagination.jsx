import React from 'react';
import Button from './Button';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className='flex justify-center space-x-2'>
        {pageNumbers.map(number => (
          <li key={number} className='page-item'>
            <Button 
              onClick={() => paginate(number)} 
              variant={currentPage === number ? 'primary' : 'outline'}
            >
              {number}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;