import React, { useState, useEffect } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { useNavigate } from '../../context/NavigationContext';
import '../../styles/animations.css';
import '../../styles/leaderboard.css'; // Import styli dla lasera

const PoolCard = ({ pool, theme, darkMode, isNew = false }) => {
  // Use our custom navigation
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  // Bonding curve percentage - używamy rzeczywistej wartości z API
  const bondingCurvePercentage = pool.bonding_curve_percentage !== null && 
                                pool.bonding_curve_percentage !== undefined &&
                                !isNaN(pool.bonding_curve_percentage) 
                                ? Math.min(Math.max(parseFloat(pool.bonding_curve_percentage), 0), 100)
                                : 0;
  
  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
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
  
  const handleCardClick = () => {
    // Use our custom navigation for splash screen
    navigate(`/pool/${pool.token_address}`);
  };
  
  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };
  
  // Ustawienia kolorów
  const cardBg = darkMode ? '#191922' : theme.bg.card;
  const border = darkMode ? '#2E2E3A' : theme.border;
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;
  
  // Calculate gravity score percentage (0-100)
  const gravityPercentage = pool.gravity_score ? Math.min(Math.max(pool.gravity_score / 10, 0), 100) : 0;
  
  // Klasy dla nowych poolów
  const newPoolClass = isNew ? 'new-pool-animation' : '';
  
  return (
    <div 
      id={`pool-${pool.id}`} 
      className={`pool-card shine-effect laser-border ${newPoolClass}`}
      onClick={handleCardClick} 
      style={{
        backgroundColor: cardBg,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        border: isNew ? `2px solid ${accentColor}` : `1px solid ${border}`,
        boxShadow: isNew ? `0 0 20px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.7)` : 'none',
        transition: 'all 0.3s ease-in-out',
        transformOrigin: 'center',
        // Używamy perspektywy dla lepszych efektów 3D
        perspective: '1000px',
        // Dodajemy filtr dla lepszego efektu
        filter: isNew ? 'brightness(1.05)' : 'none',
        // Optymalizacje wydajności
        willChange: isNew ? 'transform, box-shadow, filter' : 'transform'
      }}
    >
      {/* Pasek bonding curve po prawej stronie */}
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        width: '22px',
        height: 'calc(100% - 4px)',
        backgroundColor: 'transparent',
        borderTopRightRadius: '10px',
        borderBottomRightRadius: '10px',
        overflow: 'hidden',
        zIndex: 3
      }}>
        {/* Tło paska - subtelny gradient */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: darkMode 
            ? 'linear-gradient(to bottom, rgba(35, 35, 48, 0.9), rgba(25, 25, 34, 0.95))'
            : 'linear-gradient(to bottom, rgba(245, 245, 248, 0.9), rgba(235, 235, 240, 0.95))',
          borderLeft: `1px solid ${darkMode ? 'rgba(60, 60, 80, 0.2)' : 'rgba(200, 200, 220, 0.3)'}`,
        }}></div>
        
        {/* Wypełnienie paska z gradientem */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: `${bondingCurvePercentage}%`,
          background: `linear-gradient(to top, ${accentColor}, ${accentColor}CC)`,
          boxShadow: `0 0 10px ${accentColor}50`,
          transition: 'height 0.5s ease-out',
        }}></div>
        
        {/* Pozycja indykatora (GIF) - zmniejszona i dopasowana */}
        <div style={{
          position: 'absolute',
          bottom: `${bondingCurvePercentage}%`,
          left: '50%',
          transform: 'translate(-50%, 50%)',
          width: '20px',
          height: '20px',
          zIndex: 10,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
          transition: 'bottom 0.5s ease-out',
        }}>
          <img 
            src="/dance.gif" 
            alt="Indicator" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%'
            }}
          />
        </div>
        
        {/* Wartość procentowa na dole - bardziej stylowa */}
        <div style={{
          position: 'absolute',
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8px',
          fontWeight: 'bold',
          color: darkMode ? '#ffffff' : '#000000',
          background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
          padding: '1px 2px',
          borderRadius: '6px',
          opacity: 0.8,
          width: '24px',
          textAlign: 'center',
        }}>
          {bondingCurvePercentage.toFixed(1)}%
        </div>
      </div>
      
      {/* Badge dla nowych poolów z animacją pulsowania */}
      {isNew && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '30px', // Dostosowane, by nie nachodzić na nowy pasek
          backgroundColor: accentColor,
          color: '#FFFFFF',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 5,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          animation: 'pulse 2s infinite',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}>
          NEW
        </div>
      )}
      
      {/* Dodajemy specjalny efekt migania dla nowych poolów */}
      {isNew && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '12px',
          pointerEvents: 'none',
          zIndex: 4,
          boxShadow: `inset 0 0 10px ${accentColor}`,
          opacity: 0.3,
          animation: 'pulse 1.5s infinite alternate',
          willChange: 'opacity',
          transform: 'translateZ(0)'
        }} />
      )}
      
      {/* Nagłówek z avatarem i tytułem */}
      <div style={{
        display: 'flex',
        marginBottom: '12px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        paddingRight: '22px' // Dostosowany padding z prawej dla węższego paska
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <img 
            className={`pool-image laser-glow ${isNew ? 'pulse-image' : ''}`}
            src={pool.image_url}
            alt={pool.name}
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '8px', 
              objectFit: 'cover'
            }}
          />
          
          <div style={{ flex: 1 }}>
            {/* Nazwa i symbol */}
            <div style={{
              marginBottom: '4px',
              fontWeight: '600',
              fontSize: '16px',
              color: theme.text.primary,
              // Ensure text doesn't overflow on small screens
              wordBreak: 'break-word'
            }}>
              {pool.name} ({pool.symbol})
            </div>
            
            {/* Created by - bez godziny dodania */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '13px',
              color: theme.text.secondary,
              marginBottom: '6px'
            }}>
              created by 
              <span style={{ 
                marginLeft: '4px',
                color: theme.text.primary,
                fontWeight: '500'
              }}>
                {pool.creator_name || 'Anonymous'}
              </span>
            </div>
            
            {/* Price for mobile and desktop */}
            <div style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: theme.text.primary,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {formatPrice(pool.price_realtime || pool.price)}
              {pool.change_24h !== undefined && (
                <span style={{
                  color: pool.change_24h >= 0 ? '#5FE388' : '#FF5252',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {pool.change_24h >= 0 ? '+' : ''}{pool.change_24h.toFixed(2)}%
                </span>
              )}
            </div>
            
            {/* Market cap i replies */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ 
                color: theme.text.secondary, 
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ color: darkMode ? theme.accent.primary : theme.accent.secondary }}>mc: </span>
                <span style={{ fontWeight: '600', marginLeft: '4px', color: darkMode ? theme.accent.primary : theme.accent.secondary }}>
                  {pool.market_cap_formatted}
                </span>
              </div>
              
              {/* Replaced Ø,G text with vertical loading bar */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '18px',
                marginTop: '2px',
                marginBottom: '2px'
              }}>
                <span style={{ 
                  color: darkMode ? theme.accent.secondary : theme.accent.primary,
                  fontSize: '12px' 
                }}>
                  Ø,G:
                </span>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '6px',
                  backgroundColor: darkMode ? '#2E2E3A' : '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    height: '100%',
                    width: `${gravityPercentage}%`,
                    backgroundColor: darkMode ? theme.accent.secondary : theme.accent.primary,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease-in-out'
                  }} />
                </div>
                <span style={{ 
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? theme.accent.secondary : theme.accent.primary
                }}>
                  {pool.gravity_score ? pool.gravity_score.toFixed(2) : '0.00'}
                </span>
              </div>
              
              <div style={{ 
                color: theme.text.secondary, 
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center'
              }}>
                replies: 
                <span style={{ fontWeight: '600', marginLeft: '4px', color: theme.text.primary }}>
                  {pool.replies || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Opis jeśli istnieje */}
      {pool.description && (
        <div style={{
          backgroundColor: darkMode ? '#232330' : '#f5f5f8',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          color: theme.text.primary,
          marginTop: '8px',
          maxWidth: '100%',
          wordBreak: 'break-word',
          marginRight: '12px' // Dostosowany margin z prawej dla węższego paska
        }}>
          {truncateText(pool.description, 50)}
        </div>
      )}
    </div>
  );
};

export default PoolCard;