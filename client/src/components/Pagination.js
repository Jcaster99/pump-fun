import React from 'react';

/**
 * Pagination component for navigating between pages
 * @param {Object} props - Component props
 * @param {number} props.currentPage - The current active page
 * @param {number} props.totalPages - Total number of pages available
 * @param {Function} props.onPageChange - Callback function when page changes
 * @param {Object} props.theme - Theme object for styling
 * @returns {JSX.Element} - The pagination component
 */
const Pagination = ({ currentPage, totalPages, onPageChange, theme }) => {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null;
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30px',
      marginBottom: '30px',
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '20px',
      width: '100%'
    }}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        style={{
          background: 'transparent',
          border: 'none',
          color: theme.text.primary,
          fontWeight: '500',
          fontSize: '16px',
          padding: '5px 10px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        {'[<<]'}
      </button>
      
      <div style={{ 
        margin: '0 15px',
        fontSize: '16px',
        fontWeight: '500',
        color: theme.text.primary,
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{ marginRight: '5px' }}>Page</span>
        <span style={{ 
          color: theme.accent.primary,
          fontWeight: '700' 
        }}>
          {currentPage}
        </span>
        <span style={{ margin: '0 5px' }}>of</span>
        <span>{totalPages}</span>
      </div>
      
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        style={{
          background: 'transparent',
          border: 'none',
          color: theme.text.primary,
          fontWeight: '500',
          fontSize: '16px',
          padding: '5px 10px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        {'[>>]'}
      </button>
    </div>
  );
};

export default Pagination;