import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { usePriceContext } from '../../context/PriceContext';
import { formatDistanceToNow } from 'date-fns';

const PoolDetailHeader = ({ pool, theme }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTokenAddress, setCopiedTokenAddress] = useState(false);
  const [copiedCreatorAddress, setCopiedCreatorAddress] = useState(false);
  
  // Kontekst cenowy
  const { updateTokenPrice, getTokenPrice } = usePriceContext();
  
  // Default placeholder for pool images
  const defaultPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23EEEEEE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23AAAAAA">Pool</text></svg>';
  
  // Bonding curve percentage - używamy rzeczywistej wartości z API
  const bondingCurvePercentage = pool && pool.bonding_curve_percentage !== null && 
                               pool.bonding_curve_percentage !== undefined &&
                               !isNaN(pool.bonding_curve_percentage) 
                               ? Math.min(Math.max(parseFloat(pool.bonding_curve_percentage), 0), 100)
                               : (pool && pool.id ? Math.min(Math.max((pool.id % 100), 0), 100) : 50);
  
  // Prefer token_address; fall back to contract_address in legacy data
  const poolAddress = pool?.token_address || pool?.contract_address;
  
  // Aktualizuj cenę w kontekście globalnym, gdy pool się zmienia
  useEffect(() => {
    if (pool && poolAddress && pool.price_realtime !== undefined && pool.price_realtime !== null) {
      // Pobierz aktualną cenę z kontekstu
      const currentPrice = getTokenPrice(poolAddress);
      const newPrice = typeof pool.price_realtime === 'string' ? parseFloat(pool.price_realtime) : pool.price_realtime;
      
      // Aktualizuj tylko jeśli cena jest różna (z pewną tolerancją dla liczb zmiennoprzecinkowych)
      if (Math.abs(currentPrice - newPrice) > 0.00000001) {
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Updating token price for ${poolAddress}: ${pool.price_realtime}`);
        }
        updateTokenPrice(poolAddress, pool.price_realtime);
      }
    } else if (pool && poolAddress && pool.price !== undefined && pool.price !== null) {
      // Fallback to price if price_realtime is not available
      const currentPrice = getTokenPrice(poolAddress);
      const newPrice = typeof pool.price === 'string' ? parseFloat(pool.price) : pool.price;
      
      if (Math.abs(currentPrice - newPrice) > 0.00000001) {
        if (process.env.REACT_APP_TEST === 'true') {
          console.log(`Updating token price for ${poolAddress}: ${pool.price}`);
        }
        updateTokenPrice(poolAddress, pool.price);
      }
    }
  }, [pool, updateTokenPrice, getTokenPrice]);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Copy token address to clipboard
  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price && price !== 0) return '$0.00'; // Handle null/undefined
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (numPrice >= 1) {
      return `$${numPrice.toFixed(2)}`;
    } else if (numPrice >= 0.01) {
      return `$${numPrice.toFixed(4)}`;
    } else if (numPrice === 0) {
      return '$0.00';
    }
    
    // Handle scientific notation (very small numbers)
    const priceStr = numPrice.toString();
    
    // Check if it's in scientific notation (e.g., 1.23e-8)
    if (priceStr.includes('e-')) {
      const parts = priceStr.split('e-');
      const base = parseFloat(parts[0]);
      const exponent = parseInt(parts[1]);
      
      // Create string with the right number of leading zeros
      let result = '$0.';
      
      // Limit maximum decimal places to 16 for very small numbers
      const MAX_DECIMAL_PLACES = 16;
      
      // If too many leading zeros, truncate and display in more compact format
      if (exponent > MAX_DECIMAL_PLACES) {
        return `$${numPrice.toExponential(4)}`;
      }
      
      for (let i = 0; i < exponent - 1; i++) {
        result += '0';
      }
      
      // Add significant digits from the base (removing decimal point)
      const baseDigits = base.toString().replace('.', '');
      // Ensure we show at least 4 significant digits, but limit total decimal places
      const significantDigits = Math.min(baseDigits.length, MAX_DECIMAL_PLACES - (exponent - 1));
      result += baseDigits.substring(0, significantDigits);
      return result;
    }
    
    // Count leading zeros for regular decimal numbers
    const matches = priceStr.match(/^0\.0*/);
    
    if (!matches || !matches[0]) {
      return `$${numPrice.toFixed(4)}`;
    }
    
    const leadingZeros = matches[0].length - 2;
    
    // Limit maximum decimal places to 16
    const MAX_DECIMAL_PLACES = 16;
    const decimalPlaces = Math.min(Math.max(4, leadingZeros + 4), MAX_DECIMAL_PLACES);
    
    // Format with appropriate precision but limit max decimal places
    return `$${numPrice.toFixed(decimalPlaces)}`;
  };
  
  // Format market cap for display
  const formatMarketCap = (marketCap) => {
    if (!marketCap && marketCap !== 0) return '$0.00'; // Handle null/undefined
    
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(2)}K`;
    }
    return `$${marketCap.toFixed(2)}`;
  };
  
  // Format total supply with thousand separators
  const formatTotalSupply = (totalSupply) => {
    if (!totalSupply && totalSupply !== 0) return 'N/A';
    
    // Convert to number if it's a string
    const numTotalSupply = typeof totalSupply === 'string' ? parseFloat(totalSupply) : totalSupply;
    
    // Format with thousand separators
    return numTotalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };
  
  // Format time since creation
  const formatTimeSinceCreation = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      // Ensure the date is interpreted as UTC
      // Add 'Z' to denote UTC if not already present
      let dateStr = timestamp;
      
      // If timestamp doesn't end with Z (UTC) or +/- timezone, assume UTC and add Z
      if (!/([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
        dateStr = dateStr + 'Z';
      }
      
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return formatDistanceToNow(date, { addSuffix: false });
    } catch (err) {
      console.error('Error formatting date:', err);
      return null;
    }
  };
  
  // Handle null/undefined pool
  if (!pool) {
    return <div>Loading pool data...</div>;
  }
  
  // Ustawienia kolorów dla bonding curve
  const accentColor = theme.accent.primary;
  const darkMode = theme.bg.main === '#0A0A0A'; // Simple check for dark mode
  
  return (
    <div className="laser-border" style={{ 
      backgroundColor: theme.bg.card,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: 'none',
      height: '100%'
    }}>
      {/* Pool name and price */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '12px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={pool.image_url || defaultPlaceholder} 
            alt={pool.name} 
            style={{ 
              width: isMobile ? '64px' : '80px',
              height: isMobile ? '64px' : '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            className="laser-glow"
          />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '700',
              color: theme.text.primary
            }}>
              {pool.name}
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: theme.text.secondary,
              display: 'flex',
              alignItems: 'center'
            }}>
              ${pool.symbol}
            </p>
            
            {/* Token Address */}
            {pool.token_address && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '8px 0 0 0'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  color: theme.text.secondary,
                  fontFamily: 'monospace'
                }}>
                  Token: {pool.token_address.substring(0, 6)}...{pool.token_address.substring(pool.token_address.length - 4)}
                </p>
                <button
                  onClick={() => copyToClipboard(pool.token_address, setCopiedTokenAddress)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.text.secondary
                  }}
                  title="Copy token address"
                >
                  {copiedTokenAddress ? <Check size={14} color="#00B897" /> : <Copy size={14} />}
                </button>
                {pool.created_at && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: theme.text.secondary, 
                    marginLeft: '4px',
                    fontWeight: 'normal',
                    display: 'inline-block'
                  }}>
                    • {formatTimeSinceCreation(pool.created_at)} old
                  </span>
                )}
              </div>
            )}
            
            {/* Social Links and Creator Info */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '8px'
            }}>
              {/* Twitter Link */}
              {pool.twitter_url && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: theme.text.secondary,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: theme.text.secondary
                  }}>
                    :
                  </span>
                  <a 
                    href={pool.twitter_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent.primary,
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {pool.twitter_url.replace(/https?:\/\/(twitter\.com\/|x\.com\/)/, '')}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
              
              {/* Website Link */}
              {pool.website_url && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: theme.text.secondary,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor">
                      <path d="M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: theme.text.secondary
                  }}>
                    :
                  </span>
                  <a 
                    href={pool.website_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent.primary,
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {pool.website_url.replace(/^https?:\/\//, '')}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
              
              {/* Creator Info */}
              {pool.creator_address && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: theme.text.secondary,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor">
                      <path d="M370.7 96.1C346.1 39.5 289.7 0 224 0S101.9 39.5 77.3 96.1C60.9 97.5 48 111.2 48 128l0 64c0 16.8 12.9 30.5 29.3 31.9C101.9 280.5 158.3 320 224 320s122.1-39.5 146.7-96.1c16.4-1.4 29.3-15.1 29.3-31.9l0-64c0-16.8-12.9-30.5-29.3-31.9zM336 144l0 16c0 53-43 96-96 96l-32 0c-53 0-96-43-96-96l0-16c0-26.5 21.5-48 48-48l128 0c26.5 0 48 21.5 48 48zM189.3 162.7l-6-21.2c-.9-3.3-3.9-5.5-7.3-5.5s-6.4 2.2-7.3 5.5l-6 21.2-21.2 6c-3.3 .9-5.5 3.9-5.5 7.3s2.2 6.4 5.5 7.3l21.2 6 6 21.2c.9 3.3 3.9 5.5 7.3 5.5s6.4-2.2 7.3-5.5l6-21.2 21.2-6c3.3-.9 5.5-3.9 5.5-7.3s-2.2-6.4-5.5-7.3l-21.2-6zM112.7 316.5C46.7 342.6 0 407 0 482.3C0 498.7 13.3 512 29.7 512l98.3 0 0-64c0-17.7 14.3-32 32-32l128 0c17.7 0 32 14.3 32 32l0 64 98.3 0c16.4 0 29.7-13.3 29.7-29.7c0-75.3-46.7-139.7-112.7-165.8C303.9 338.8 265.5 352 224 352s-79.9-13.2-111.3-35.5zM176 448c-8.8 0-16 7.2-16 16l0 48 32 0 0-48c0-8.8-7.2-16-16-16zm96 32a16 16 0 1 0 0-32 16 16 0 1 0 0 32z" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: theme.text.secondary
                  }}>
                    :
                  </span>
                  <a 
                    href={`https://chainscan-galileo.0g.ai/address/${pool.creator_address}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent.primary,
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {pool.creator_name || pool.creator_address.substring(0, 6) + '...' + pool.creator_address.substring(pool.creator_address.length - 4)}
                    <ExternalLink size={10} />
                  </a>
                  
                </div>
              )}
            </div>
            
            {/* Price on mobile */}
            {isMobile && (
              <div style={{ marginTop: '8px' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '700',
                  color: theme.text.primary
                }}>
                  {formatPrice(pool.price_realtime || pool.price)}
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '14px', 
                  color: pool.change_24h >= 0 ? '#00B897' : '#FF5757'
                }}>
                  {pool.change_24h >= 0 ? '+' : ''}{pool.change_24h.toFixed(2)}% (24h)
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Price on desktop */}
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '700',
              color: theme.text.primary
            }}>
              {formatPrice(pool.price_realtime || pool.price)}
            </h2>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: pool.change_24h >= 0 ? '#00B897' : '#FF5757'
            }}>
              {pool.change_24h >= 0 ? '+' : ''}{pool.change_24h.toFixed(2)}% (24h)
            </p>
          </div>
        )}
      </div>
      
      {/* Pool metrics */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr 1fr',
        gap: '12px',
        backgroundColor: theme.bg.panel,
        borderRadius: '8px',
        padding: '14px'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary }}>
            Market Cap
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: theme.text.primary }}>
            {formatMarketCap(pool.market_cap)}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary }}>
            Liquidity
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: theme.text.primary }}>
            {formatMarketCap(pool.liquidity)}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary }}>
            Volume (24h)
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: theme.text.primary }}>
            {formatMarketCap(pool.volume_24h)}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary }}>
            Holders
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: theme.text.primary }}>
            {pool.holders.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary }}>
            Total Supply
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: theme.text.primary }}>
            {formatTotalSupply(pool.total_supply)}
          </p>
        </div>
      </div>
      
      {/* How this token will defy gravity section */}
      <div style={{
        backgroundColor: theme.bg.panel,
        borderRadius: '12px',
        padding: '16px',
        marginTop: '6px',
        flex: 1
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0',
          fontSize: '16px', 
          fontWeight: '600',
          color: theme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span 
            style={{
              display: 'inline-block',
              width: '6px',
              height: '20px',
              backgroundColor: theme.accent.primary,
              borderRadius: '3px'
            }}
          />
          How this token will defy gravity?
        </h3>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          color: theme.text.secondary,
          lineHeight: '1.5'
        }}>
          {pool.description || "This token leverages a unique bonding curve and liquidity mechanism to maintain price stability while encouraging growth. With built-in incentives for long-term holders and a community-driven approach to development, it's designed to resist market volatility and sustain upward momentum."}
        </p>
      </div>
    </div>
  );
};

export default PoolDetailHeader; 