import React from 'react';

/**
 * Komponent wyświetlający powiadomienie o statusie transakcji
 * @param {Object} props - Właściwości komponentu
 * @param {string} props.status - Status transakcji ('pending', 'success', 'error')
 * @param {string} props.message - Wiadomość do wyświetlenia
 * @param {Object} props.theme - Obiekt motywu
 * @param {boolean} props.darkMode - Flaga trybu ciemnego
 */
const StatusNotification = ({ status = 'pending', message, theme, darkMode }) => {
  // Określenie koloru i ikony na podstawie statusu
  let color, backgroundColor;
  
  switch (status) {
    case 'success':
      color = '#00B897';
      backgroundColor = darkMode ? 'rgba(0, 184, 151, 0.15)' : 'rgba(0, 184, 151, 0.1)';
      break;
    case 'error':
      color = '#FF5757';
      backgroundColor = darkMode ? 'rgba(255, 87, 87, 0.15)' : 'rgba(255, 87, 87, 0.1)';
      break;
    case 'pending':
    default:
      color = '#0088FF';
      backgroundColor = darkMode ? 'rgba(0, 136, 255, 0.15)' : 'rgba(0, 136, 255, 0.1)';
      break;
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      borderRadius: '8px',
      backgroundColor: backgroundColor,
      border: `1px solid ${color}`,
      marginBottom: '12px'
    }}>
      {/* Wskaźnik statusu (kropka) */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: '12px',
        animation: status === 'pending' ? 'pulse 1.5s infinite ease-in-out' : 'none'
      }} />
      
      {/* Wiadomość */}
      <div 
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: theme ? theme.text.primary : (darkMode ? '#FFFFFF' : '#000000')
        }}
        dangerouslySetInnerHTML={{ __html: message }}
      />
      
      {/* Style dla animacji i linków */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.8);
          }
        }
        
        div a {
          color: ${color};
          text-decoration: none;
          font-weight: 600;
        }
        
        div a:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default StatusNotification; 