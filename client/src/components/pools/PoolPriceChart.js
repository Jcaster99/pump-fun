import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPriceHistory } from '../../api/priceHistoryApi';
import LoadingSpinner from '../common/LoadingSpinner';

const timeRanges = [
  { value: '15m', label: '15M' },
  { value: '4h', label: '4H' },
  { value: '24h', label: '24H' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'All' }
];

const PoolPriceChart = ({ pool, theme, darkMode }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Prefer token_address; fall back to contract_address for backward compatibility
  const poolAddress = pool?.token_address || pool?.contract_address;
  
  // Fetch price history when component mounts or timeRange changes
  useEffect(() => {
    const loadPriceData = async () => {
      try {
        setLoading(true);
        const response = await fetchPriceHistory(poolAddress, timeRange);
        
        if (response.success) {
          // Transformuj dane, aby były kompatybilne z wykresem
          const formattedData = response.data.map(item => ({
            // Parsuj timestamp jeśli jest to string, lub używaj jako jest
            date: typeof item.date === 'string' ? item.date : item.date.toISOString(),
            price: item.price
          }));
          
          setPriceData(formattedData);
          
          if (formattedData.length === 0 && response.message) {
            setError(response.message);
          } else if (formattedData.length === 0) {
            setError('Brak danych do wyświetlenia dla tego zakresu czasowego');
          } else {
            setError(null);
          }
        } else {
          setError(response.error || 'Failed to load price history');
        }
      } catch (err) {
        console.error('Error loading price history:', err);
        setError('Error loading price history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (poolAddress) {
      loadPriceData();
    }
  }, [poolAddress, timeRange]);
  
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
    
    // Dla bardzo małych wartości (poniżej 0.01), używamy notacji wykładniczej dla osi Y
    if (numPrice < 0.0001) {
      return `$${numPrice.toExponential(2)}`;
    }
    
    // Dla pozostałych małych wartości, używamy stałej liczby miejsc po przecinku
    return `$${numPrice.toFixed(6)}`;
  };
  
  // Komponent paska interwałów czasowych
  const TimeRangeSelector = () => (
    <div style={{ 
      display: 'flex', 
      backgroundColor: theme.bg.panel,
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {timeRanges.map(range => (
        <button 
          key={range.value}
          style={{
            backgroundColor: timeRange === range.value ? theme.accent.primary : 'transparent',
            color: timeRange === range.value ? 'white' : theme.text.secondary,
            border: 'none',
            padding: '6px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onClick={() => setTimeRange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
  
  // Render loading state
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '18px', 
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Gravity Chart
          </h3>
          
          <TimeRangeSelector />
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <LoadingSpinner text="Loading price chart..." size={30} />
        </div>
      </div>
    );
  }
  
  // Render error state - ale wciąż z możliwością przełączania interwałów
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '18px', 
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Gravity Chart
          </h3>
          
          <TimeRangeSelector />
        </div>
        
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
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Try a different time range from the options above.</p>
        </div>
      </div>
    );
  }
  
  // Render empty state - również z możliwością przełączania interwałów
  if (priceData.length === 0) {
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '18px', 
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Gravity Chart
          </h3>
          
          <TimeRangeSelector />
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: theme.text.secondary
        }}>
          <p>No price data available for this time range.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Try a different time range from the options above.</p>
        </div>
      </div>
    );
  }
  
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '18px', 
          fontWeight: '600',
          color: theme.text.primary
        }}>
          Gravity Chart
        </h3>
        
        <TimeRangeSelector />
      </div>
      
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceData}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? '#2E2E3A' : '#EAEAEF'} 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fill: theme.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              tickFormatter={(date) => {
                // Zapewniamy, że data jest interpretowana jako UTC
                let dateStr = date;
                
                // Jeśli timestamp nie kończy się na Z (UTC) lub +/- strefą czasową, uznajemy za UTC i dodajemy Z
                if (!/([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
                  dateStr = dateStr + 'Z';
                }
                
                const dateObj = new Date(dateStr);
                
                // Sprawdź czy data jest poprawna
                if (isNaN(dateObj.getTime())) {
                  return 'Invalid date';
                }
                
                // Różne formaty dla różnych zakresów czasowych
                if (timeRange === '15m') {
                  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeRange === '4h') {
                  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeRange === '24h') {
                  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                  return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                }
              }}
            />
            <YAxis 
              tick={{ fill: theme.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              tickFormatter={(price) => formatPrice(price)}
              domain={['auto', 'auto']}
              width={80}
              style={{ fontSize: '10px' }}
            />
            <Tooltip 
              formatter={(value) => {
                // Dla tooltipa możemy pokazać więcej miejsc po przecinku
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                // Dla tooltipa używamy pełnego zapisu dziesiętnego (bez notacji naukowej)
                if (numValue < 0.0001 && numValue > 0) {
                  // Określ liczbę zer po przecinku + 5 cyfr znaczących
                  const priceStr = numValue.toString();
                  let decimalPlaces = 5; // Domyślnie 5 cyfr znaczących
                  
                  // Jeśli wartość jest w notacji naukowej, oblicz potrzebną liczbę miejsc
                  if (priceStr.includes('e-')) {
                    const parts = priceStr.split('e-');
                    const exponent = parseInt(parts[1]);
                    decimalPlaces = exponent + 4; // exponent plus 4 dodatkowe cyfry znaczące
                  } else {
                    // Policz zera po przecinku dla standardowych liczb dziesiętnych
                    const matches = priceStr.match(/^0\.0*/);
                    if (matches && matches[0]) {
                      decimalPlaces = matches[0].length - 2 + 4;
                    }
                  }
                  
                  return [`$${numValue.toFixed(decimalPlaces)}`, 'Price'];
                } else {
                  return [formatPrice(value), 'Price'];
                }
              }}
              labelFormatter={(date) => {
                // Zapewniamy, że data jest interpretowana jako UTC
                let dateStr = date;
                
                // Jeśli timestamp nie kończy się na Z (UTC) lub +/- strefą czasową, uznajemy za UTC i dodajemy Z
                if (!/([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
                  dateStr = dateStr + 'Z';
                }
                
                const dateObj = new Date(dateStr);
                
                // Sprawdź czy data jest poprawna
                if (isNaN(dateObj.getTime())) {
                  return 'Invalid date';
                }
                
                return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
              contentStyle={{
                backgroundColor: theme.bg.card,
                borderColor: theme.border,
                borderRadius: '8px',
                color: theme.text.primary
              }}
            />
            <Line
              type="monotone" 
              dataKey="price" 
              stroke={theme.accent.primary} 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: theme.accent.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PoolPriceChart; 