import React from 'react';

export const TableHeader = ({ children, theme }) => (
  <th style={{ 
    textAlign: 'left', 
    padding: '12px 20px',
    color: theme.text.secondary,
    fontWeight: '500',
    fontSize: '14px',
    borderBottom: `1px solid ${theme.border}`
  }}>
    {children}
  </th>
);

export const TableRow = ({ children, theme, onClick, darkMode }) => {
  return (
    <tr 
      style={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1A1A23' : '#F0F0F5'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, isFirst, isLast }) => (
  <td style={{ 
    padding: '16px 20px',
    borderRadius: isFirst ? '12px 0 0 12px' : isLast ? '0 12px 12px 0' : '0'
  }}>
    {children}
  </td>
); 