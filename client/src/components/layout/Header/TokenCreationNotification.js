import React, { useState, useEffect } from 'react';
import { useTransaction } from '../../../context/TransactionContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from '../../../context/NavigationContext';

const TokenCreationNotification = () => {
  const { lastNewPool } = useTransaction();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [poolData, setPoolData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (lastNewPool) {
      // Najpierw ukryj aktualne powiadomienie jeśli istnieje
      if (visible && poolData) {
        setAnimateOut(true);
        setTimeout(() => {
          setAnimateOut(false);
          setPoolData(lastNewPool);
          setVisible(true);
        }, 300); // Poczekaj aż animacja wyjścia się zakończy
      } else {
        // Jeśli nie ma aktualnego powiadomienia, po prostu pokaż nowe
        setPoolData(lastNewPool);
        setVisible(true);
        setAnimateOut(false);
      }
    }
  }, [lastNewPool]);

  if (!visible || !poolData) return null;

  const { symbol, token_address } = poolData;
  
  // Funkcja do nawigacji do szczegółów puli po kliknięciu
  const handleClick = () => {
    if (token_address) {
      navigate(`/pool/${token_address}`);
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '12px',
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        maxWidth: '100%',
        opacity: animateOut ? 0 : 1,
        transform: `translateY(${animateOut ? '-10px' : '0'})`,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        marginBottom: '10px',
        marginRight: '10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: token_address ? 'pointer' : 'default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      onClick={handleClick}
    >
      <span style={{ fontWeight: '500', fontSize: '14px', color: theme.text.secondary }}>
        <span 
          style={{ 
            color: theme.text.primary, 
            fontWeight: '600'
          }}
        >
          {symbol}
        </span>
        {' '}
        <span style={{ color: '#FFC107' }}>has been factored</span>
      </span>
    </div>
  );
};

export default TokenCreationNotification; 