import React from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const Pagination = ({
  // Old props (for backward compatibility)
  itemsPerPage,
  totalItems,
  paginate,
  // New props (for modern usage)
  totalPages: totalPagesProp,
  onPageChange,
  currentPage
}) => {
  // Calculate totalPages based on which props are provided
  const totalPages = totalPagesProp || Math.ceil(totalItems / itemsPerPage);
  const handlePageChange = onPageChange || paginate;

  const maxPageNumbersToShow = 5; // Increased for better UX

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      handlePageChange(totalPages);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= maxPageNumbersToShow + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  // Hide pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Page Info */}
      <div className="text-sm text-text-secondary flex items-center gap-2">
        <Icon name="FileText" size={16} className="opacity-50" />
        <span>
          Halaman <span className="font-semibold text-text-primary">{currentPage}</span> dari{' '}
          <span className="font-semibold text-text-primary">{totalPages}</span>
        </span>
      </div>

      {/* Pagination Controls */}
      <ul className='flex items-center gap-1'>
        {/* First Page Button */}
        <li>
          <Button
            onClick={handleFirst}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            iconName="ChevronsLeft"
            title="Halaman Pertama"
            className="hidden sm:flex"
          />
        </li>

        {/* Previous Button */}
        <li>
          <Button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            iconName="ChevronLeft"
            title="Halaman Sebelumnya"
          />
        </li>

        {/* Page Numbers */}
        {pageNumbers.map((number, index) => (
          <li key={index} className='page-item'>
            {number === '...' ? (
              <span className="flex items-center justify-center h-9 w-9 text-sm text-text-secondary">...</span>
            ) : (
              <Button
                onClick={() => handlePageChange(number)}
                variant={currentPage === number ? 'default' : 'outline'}
                size="sm"
                className="min-w-[36px]"
              >
                {number}
              </Button>
            )}
          </li>
        ))}

        {/* Next Button */}
        <li>
          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            iconName="ChevronRight"
            title="Halaman Selanjutnya"
          />
        </li>

        {/* Last Page Button */}
        <li>
          <Button
            onClick={handleLast}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            iconName="ChevronsRight"
            title="Halaman Terakhir"
            className="hidden sm:flex"
          />
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;