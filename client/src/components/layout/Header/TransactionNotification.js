import React, { useState, useEffect } from 'react';
import { useTransaction } from '../../../context/TransactionContext';
import { useTheme } from '../../../context/ThemeContext';
import { formatAddress } from '../../../utils/addressUtils';
import { useNavigate } from '../../../context/NavigationContext';
import { ethers } from 'ethers';

const TransactionNotification = () => {
  const { lastTransaction } = useTransaction();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (lastTransaction) {
      // Pomijamy transakcje typu 'approve' i 'addLiquidity'
      if (lastTransaction.type === 'approve' || lastTransaction.type === 'addLiquidity') {
        return;
      }
      
      // Najpierw ukryj aktualne powiadomienie jeśli istnieje
      if (visible && transactionData) {
        setAnimateOut(true);
        setTimeout(() => {
          setAnimateOut(false);
          setTransactionData(lastTransaction);
          setVisible(true);
        }, 300); // Poczekaj aż animacja wyjścia się zakończy
      } else {
        // Jeśli nie ma aktualnego powiadomienia, po prostu pokaż nowe
        setTransactionData(lastTransaction);
        setVisible(true);
        setAnimateOut(false);
      }
      
      // Nie ukrywamy już powiadomienia automatycznie - będzie widoczne do momentu
      // nadejścia nowego powiadomienia lub odświeżenia strony
    }
  }, [lastTransaction]);

  if (!visible || !transactionData) return null;
  
  // Dodatkowa weryfikacja, aby upewnić się, że nie wyświetlamy niechcianych typów transakcji
  if (transactionData.type === 'approve' || transactionData.type === 'addLiquidity') return null;

  const { wallet_address, amount, symbol, type, contract_address, tx_hash, username: txUsername, status } = transactionData;
  
  // Określ akcję, kolor i treść powiadomienia na podstawie typu transakcji
  let action, highlightColor, statusText;
  
  // Domyślne ustawienia dla statusu, jeśli nie jest określony
  const txStatus = status || 'success';
  
  if (txStatus === 'pending') {
    statusText = type === 'buy' ? 'Buying tokens...' : 'Selling tokens...';
    highlightColor = '#0088FF'; // niebieski dla oczekiwania
  } else if (txStatus === 'failed') {
    statusText = type === 'buy' ? 'Token purchase failed' : 'Token sale failed';
    highlightColor = '#FF5757'; // czerwony dla niepowodzenia
  } else {
    // Status success lub brak statusu (domyślny)
    if (type === 'buy') {
      action = 'bought';
      highlightColor = '#00B897'; // zielony
    } else if (type === 'sell') {
      action = 'sold';
      highlightColor = '#FF5757'; // czerwony
    }
  }
  
  // Funkcja do formatowania liczb w zależności od urządzenia
  const formatAmountForDisplay = (value) => {
    if (!value && value !== 0) return '';
    
    const numValue = parseFloat(value);
    
    // Na urządzeniach mobilnych używamy skróconego formatu
    if (isMobile) {
      if (numValue >= 1000000000) {
        return `${(numValue / 1000000000).toFixed(1)}B`;
      } else if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(1)}K`;
      } else {
        return numValue.toFixed(2);
      }
    }
    
    // Na desktopie używamy pełnego formatu z separatorami
    return numValue.toLocaleString(undefined, { 
      maximumFractionDigits: 2 
    });
  };
  
  // Formatuj kwotę
  const formattedAmount = formatAmountForDisplay(amount);

  // Pobierz nazwę użytkownika z danych transakcji lub z localStorage
  const username = txUsername || localStorage.getItem(`username_${wallet_address.toLowerCase()}`) || null;
  
  // Funkcja formatująca adres do checksumowego formatu
  const toChecksumAddress = (address) => {
    if (!address) return address;
    try {
      return ethers.utils.getAddress(address);
    } catch (error) {
      console.error("Invalid address format:", error);
      return address;
    }
  };
  
  // Funkcja do nawigacji do szczegółów puli po kliknięciu na symbol
  const handleSymbolClick = () => {
    if (contract_address) {
      // Używamy adresu małymi literami zamiast checksumowego dla poprawnego linku
      navigate(`/pool/${contract_address}`);
    }
  };
  
  // Funkcja do nawigacji do szczegółów transakcji
  const handleTransactionClick = () => {
    if (tx_hash) {
      window.open(`https://chainscan-galileo.0g.ai/tx/${tx_hash}`, '_blank');
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
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: tx_hash ? 'pointer' : 'default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      onClick={tx_hash ? handleTransactionClick : undefined}
    >
      {/* Wskaźnik statusu transakcji (kropka) */}
      {status === 'pending' && (
        <div style={{ 
          width: '8px', 
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#0088FF',
          marginRight: '8px',
          animation: 'pulse 1.5s infinite ease-in-out'
        }} />
      )}
      
      {txStatus === 'pending' ? (
        // Powiadomienie dla transakcji w toku
        <span style={{ fontWeight: '500', fontSize: '14px', color: theme.text.primary }}>
          {statusText}
        </span>
      ) : (
        // Powiadomienie dla zakończonych transakcji
        <span style={{ fontWeight: '500', fontSize: '14px', color: theme.text.secondary }}>
          <span style={{ color: theme.text.primary }}>
            {username ? `@${username}` : formatAddress(wallet_address)}
          </span>
          {' '}
          <span style={{ color: highlightColor }}>{action}</span>
          {' '}
          {formattedAmount && (
            <>
              <span style={{ fontWeight: '600' }}>{formattedAmount}</span>
              {' of '}
            </>
          )}
          <span 
            style={{ 
              color: theme.text.primary, 
              fontWeight: '600',
              cursor: contract_address ? 'pointer' : 'default'
            }}
            onClick={contract_address ? (e) => {
              e.stopPropagation();
              handleSymbolClick();
            } : undefined}
          >
            {symbol}
          </span>
        </span>
      )}
      
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
      `}</style>
    </div>
  );
};

export default TransactionNotification; 