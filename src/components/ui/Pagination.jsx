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
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 p-2">
      {/* Page Info (Native Style) */}
      <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
        <Icon name="FileText" size={14} className="text-primary opacity-70" strokeWidth={2.5} />
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">
          Halaman <span className="text-gray-900 dark:text-white px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-lg shadow-inner border border-gray-100 dark:border-slate-700 mx-1">{currentPage}</span> Dari <span className="text-gray-900 dark:text-white">{totalPages}</span>
        </span>
      </div>

      {/* Pagination Controls (Native Premium) */}
      <ul className='flex items-center gap-2'>
        {/* Navigation Buttons Row */}
        <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
          <li>
            <Button
              onClick={handleFirst}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              iconName="ChevronsLeft"
              title="Halaman Pertama"
              className="hidden sm:flex border-none hover:bg-white dark:hover:bg-slate-800 rounded-xl"
            />
          </li>
          <li>
            <Button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              title="Halaman Sebelumnya"
              className="border-none hover:bg-white dark:hover:bg-slate-800 rounded-xl"
            />
          </li>
        </div>

        {/* Page Numbers Row */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-inner border border-gray-100 dark:border-slate-700 mx-1">
          {pageNumbers.map((number, index) => (
            <li key={index} className='page-item'>
              {number === '...' ? (
                <span className="flex items-center justify-center h-9 w-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(number)}
                  className={`flex items-center justify-center h-9 min-w-[36px] px-3 rounded-xl text-[11px] font-black transition-all duration-200 ${currentPage === number
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105 active:scale-95'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {number}
                </button>
              )}
            </li>
          ))}
        </div>

        {/* Next Buttons Row */}
        <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
          <li>
            <Button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              title="Halaman Selanjutnya"
              className="border-none hover:bg-white dark:hover:bg-slate-800 rounded-xl"
            />
          </li>
          <li>
            <Button
              onClick={handleLast}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              iconName="ChevronsRight"
              title="Halaman Terakhir"
              className="hidden sm:flex border-none hover:bg-white dark:hover:bg-slate-800 rounded-xl"
            />
          </li>
        </div>
      </ul>
    </nav>
  );
};

export default Pagination;