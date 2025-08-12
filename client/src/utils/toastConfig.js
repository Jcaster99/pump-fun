import React from 'react';
import { ArrowRight, Check, XCircle } from 'lucide-react';

/**
 * Konfiguracja wspólnych stylów dla powiadomień
 * @param {Object} theme - Obiekt z motywem aplikacji
 * @param {boolean} darkMode - Flaga określająca czy aplikacja jest w trybie ciemnym
 * @returns {Object} Obiekty ze stylami dla powiadomień
 */
export const createToastStyles = (theme, darkMode) => {
  // Podstawowy styl dla wszystkich powiadomień
  const baseToastStyle = {
    background: darkMode ? '#1F2128' : '#FFFFFF',
    color: theme.text.primary,
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '320px'
  };

  // Styl dla powiadomień o sukcesie
  const successToastStyle = {
    ...baseToastStyle,
    background: darkMode ? `${theme.accent.primary}15` : `${theme.accent.primary}10`,
    border: `1px solid ${theme.accent.primary}30`
  };

  // Styl dla powiadomień o błędzie
  const errorToastStyle = {
    ...baseToastStyle,
    background: darkMode ? 'rgba(255, 87, 87, 0.15)' : 'rgba(255, 87, 87, 0.1)',
    border: '1px solid rgba(255, 87, 87, 0.2)'
  };

  return {
    baseToastStyle,
    successToastStyle,
    errorToastStyle
  };
};

/**
 * Animowany spinner dla powiadomień o ładowaniu
 * @param {string} color - Kolor spinnera
 * @returns {JSX.Element} Komponent spinnera
 */
export const SpinnerIcon = ({ color }) => (
  <div className="spinner-pulse">
    <style jsx="true">{`
      .spinner-pulse {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: ${color};
        animation: pulse 1.5s infinite ease-in-out;
      }
      @keyframes pulse {
        0% { opacity: 1; transform: scale(0.8); }
        50% { opacity: 0.5; transform: scale(1); }
        100% { opacity: 1; transform: scale(0.8); }
      }
    `}</style>
  </div>
);

/**
 * Standardowa konfiguracja dla wszystkich powiadomień
 */
export const defaultToastConfig = {
  position: 'bottom-right',
  duration: 5000
};

/**
 * Powiadomienie o sukcesie z linkiem do explorera
 * @param {string} message - Główna wiadomość powiadomienia
 * @param {string} txHash - Hash transakcji do wyświetlenia linku do explorera
 * @param {Object} theme - Obiekt z motywem aplikacji
 * @param {Object} transactionInfo - Informacje o transakcji (opcjonalne)
 * @returns {JSX.Element} Zawartość powiadomienia
 */
export const SuccessToastWithExplorer = ({ message, txHash, theme, transactionInfo }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <span style={{ fontWeight: '600' }}>{message}</span>
    
    {/* Informacje o transakcji */}
    {transactionInfo && (
      <div style={{ 
        fontSize: '13px', 
        color: theme.text.secondary,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: theme.text.primary,
          fontWeight: '500'
        }}>
          <span>{transactionInfo.type === 'buy' ? '🔹 Bought:' : '🔸 Sold:'}</span>
          <span>
            {transactionInfo.type === 'buy' 
              ? `${parseFloat(transactionInfo.actualAmount).toFixed(6)} ${transactionInfo.symbol}`
              : `${parseFloat(transactionInfo.actualAmount).toFixed(2)} USDT`
            }
          </span>
        </div>
      </div>
    )}
    
    {/* Link do explorera */}
    {txHash && (
      <a 
        href={`https://chainscan-galileo.0g.ai/tx/${txHash}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          color: theme.accent.primary,
          textDecoration: 'none',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        View on explorer <ArrowRight size={12} />
      </a>
    )}
  </div>
);

/**
 * Generuje ikony dla różnych typów powiadomień
 */
export const toastIcons = {
  success: (theme) => <Check size={18} color={theme.accent.primary} />,
  error: () => <XCircle size={18} color="#FF5757" />,
  loading: (color) => <SpinnerIcon color={color} />
}; 