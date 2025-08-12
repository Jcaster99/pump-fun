import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import LoadingSpinner from '../../common/LoadingSpinner';

const PoolTransactionHistoryView = ({ pool, theme, darkMode, transactions, loading, error }) => {
  // Format timestamp to relative time (e.g. "5 minutes ago")
  const formatTimestamp = (timestamp) => {
    try {
      // Upewnij się, że data jest interpretowana jako UTC
      // SQLite używa formatu ISO-like bez strefy czasowej, więc dodajemy 'Z' aby oznaczyć UTC
      let dateStr = timestamp;
      
      // Jeśli timestamp nie kończy się na Z (UTC) lub +/- strefą czasową, uznajemy za UTC i dodajemy Z
      if (!/([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
        dateStr = dateStr + 'Z';
      }
      
      const date = new Date(dateStr);
      
      // Sprawdź czy data jest poprawna
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'unknown time';
    }
  };
  
  // Format address to short form and mark as dev if creator
  const formatAddress = (address, creatorAddress) => {
    if (!address) return '0x...';
    
    const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    
    // Check if this is the creator's address
    const isDev = creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase();
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/dance.gif" alt="Avatar" style={{ width: '20px', height: '20px' }} />
        <span>
          {shortAddress} {isDev && <span style={{ color: theme.accent.primary, fontWeight: 600 }}>dev</span>}
        </span>
      </div>
    );
  };
  
  // Get explorer URL based on environment
  const getExplorerUrl = (txHash) => {
    // This should be from config based on network, but for now hardcoding Base explorer
    return `https://basescan.org/tx/${txHash}`;
  };
  
  if (loading) {
    return (
      <div className="laser-border" style={{ 
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: 'none'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.text.primary
        }}>
          Recent Transactions
        </h3>
        
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <LoadingSpinner text="Loading transactions..." size={30} />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="laser-border" style={{ 
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 'none'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0',
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.text.primary
        }}>
          Recent Transactions
        </h3>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: theme.text.secondary
        }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  // If no transactions found
  if (!transactions || transactions.length === 0) {
    return (
      <div className="laser-border" style={{ 
        backgroundColor: theme.bg.card,
        borderRadius: '16px',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 'none'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0',
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.text.primary
        }}>
          Recent Transactions
        </h3>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: theme.text.secondary
        }}>
          <p>No transactions yet for this token.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="laser-border" style={{ 
      backgroundColor: theme.bg.card,
      borderRadius: '16px',
      padding: '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: 'none',
      overflow: 'hidden'
    }}>
      <h3 style={{ 
        margin: '0 0 24px 0',
        fontSize: '20px', 
        fontWeight: '600',
        color: theme.text.primary
      }}>
        Recent Transactions
      </h3>
      
      <div style={{
        overflow: 'auto',
        marginRight: '-10px',
        paddingRight: '10px',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 10px',
          fontSize: '16px',
        }}>
          <thead>
            <tr>
              <th style={{ 
                textAlign: 'left', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '30%'
              }}>
                Trader
              </th>
              <th style={{ 
                textAlign: 'center', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '15%'
              }}>
                Action
              </th>
              <th style={{ 
                textAlign: 'right', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '15%'
              }}>
                USDT
              </th>
              <th style={{ 
                textAlign: 'right', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '15%'
              }}>
                {pool?.symbol || 'Token'}
              </th>
              <th style={{ 
                textAlign: 'right', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '25%'
              }}>
                Date
              </th>
              <th style={{ 
                textAlign: 'center', 
                color: theme.text.secondary, 
                fontWeight: 500,
                padding: '0 0 12px 0',
                width: '5%'
              }}>
                Tx
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} style={{
                background: darkMode ? 'rgba(30, 30, 40, 0.4)' : 'rgba(240, 240, 250, 0.4)',
                borderRadius: '12px',
                height: '56px'
              }}>
                <td style={{ 
                  padding: '16px', 
                  color: theme.text.primary, 
                  borderTopLeftRadius: '12px', 
                  borderBottomLeftRadius: '12px',
                  fontSize: '15px'
                }}>
                  {formatAddress(tx.wallet_address, tx.creator_address)}
                </td>
                <td style={{ 
                  padding: '16px', 
                  color: tx.type === 'buy' ? '#00B897' : '#FF5757',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '15px'
                }}>
                  {tx.type}
                </td>
                <td style={{ 
                  padding: '16px', 
                  color: theme.text.primary,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '15px'
                }}>
                  {tx.usdt_amount ? parseFloat(tx.usdt_amount).toFixed(2) : '0.00'}
                </td>
                <td style={{ 
                  padding: '16px', 
                  color: theme.text.primary,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '15px'
                }}>
                  {tx.token_amount ? parseFloat(tx.token_amount).toFixed(tx.token_amount > 100 ? 2 : 6) : '0.00'}
                </td>
                <td style={{ 
                  padding: '16px', 
                  color: theme.text.secondary,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  fontSize: '15px'
                }}>
                  {formatTimestamp(tx.timestamp)}
                </td>
                <td style={{ 
                  padding: '16px', 
                  textAlign: 'center',
                  borderTopRightRadius: '12px', 
                  borderBottomRightRadius: '12px' 
                }}>
                  <a 
                    href={getExplorerUrl(tx.tx_hash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent.primary,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="View transaction on explorer"
                  >
                    <ExternalLink size={18} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolTransactionHistoryView; 