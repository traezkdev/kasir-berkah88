import React from 'react';
import Button from './Button';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxPageNumbersToShow = 2;

  const handlePrevious = () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= maxPageNumbersToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

      if (endPage - startPage + 1 < maxPageNumbersToShow) {
        startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  // Hide pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav>
      <ul className='mt-6 flex justify-center items-center space-x-1.5'>
        <li>
          <Button 
            onClick={handlePrevious} 
            disabled={currentPage === 1} 
            variant="outline" 
            size="sm"
            iconName="ChevronLeft"
          />
        </li>
        {pageNumbers.map((number, index) => (
          <li key={index} className='page-item'>
            {number === '...' ? (
              <span className="flex items-center justify-center h-9 w-9 text-sm text-text-secondary">...</span>
            ) : (
              <Button
                onClick={() => paginate(number)}
                variant={currentPage === number ? 'default' : 'outline'}
                size="sm"
                className="w-9"
              >
                {number}
              </Button>
            )}
          </li>
        ))}
        <li>
          <Button 
            onClick={handleNext} 
            disabled={currentPage === totalPages} 
            variant="outline" 
            size="sm"
            iconName="ChevronRight"
          />
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;