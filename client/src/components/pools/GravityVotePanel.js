import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { addRating, getUserRating, getAverageRating } from '../../api/ratingsApi';

const GravityVotePanel = ({ pool, theme, darkMode }) => {
  const { isConnected, address, requestSignature } = useWallet();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Prefer token_address; fall back to contract_address for message signing
  const poolAddress = pool?.token_address || pool?.contract_address;

  // Pobierz ocenę użytkownika i średnią ocenę puli
  useEffect(() => {
    if (!pool || !pool.id || dataFetched) return;

    const fetchRatings = async () => {
      try {
        // Pobierz średnią ocenę puli
        const averageRes = await getAverageRating(pool.id);
        if (averageRes.success) {
          setAverageRating(averageRes.data.average);
          setTotalVotes(averageRes.data.count);
        }

        // Pobierz ocenę użytkownika jeśli jest zalogowany
        if (isConnected && address) {
          const userRatingRes = await getUserRating(pool.id);
          if (userRatingRes.success && userRatingRes.data.rating) {
            setUserRating(userRatingRes.data.rating);
          }
        }
        
        // Mark data as fetched to prevent repeated calls
        setDataFetched(true);
      } catch (err) {
        console.error('Error fetching ratings:', err);
        // Still mark as fetched to prevent repeated error calls
        setDataFetched(true);
      }
    };

    fetchRatings();
  }, [pool, isConnected, address, dataFetched]);

  // Reset dataFetched when pool changes
  useEffect(() => {
    if (pool?.id) {
      setDataFetched(false);
    }
  }, [pool?.id]);

  // Obsługa submitu oceny
  const handleRatingSubmit = async (rating) => {
    if (!isConnected) {
      setError('Please connect your wallet to vote');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      
      // Wiadomość do podpisania
      const message = `I am rating the pool ${poolAddress} with ${rating} stars.`;
      
      // Poproś użytkownika o podpisanie wiadomości
      const signature = await requestSignature(message);
      
      // Zapisz ocenę w API
      const response = await addRating(pool.id, rating, signature);
      
      if (response.success) {
        setUserRating(rating);
        setAverageRating(response.data.averageRating);
        setTotalVotes(response.data.count);
        setSuccess(true);
        
        // Wyczyść powiadomienie o sukcesie po 3 sekundach
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.message || 'Error submitting rating');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.message || 'Error submitting rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Renderowanie gwiazdek
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= (hoverRating || userRating);
      
      stars.push(
        <Star
          key={i}
          size={24}
          fill={filled ? theme.accent.primary : 'transparent'}
          color={filled ? theme.accent.primary : theme.text.secondary}
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: filled ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={() => handleRatingSubmit(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        />
      );
    }
    
    return stars;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: darkMode ? 'rgba(30, 30, 42, 0.5)' : 'rgba(245, 245, 248, 0.5)',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '8px', 
        color: theme.text.primary,
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Gravity Vote
      </h3>
      
      <p style={{ 
        margin: '0 0 16px', 
        color: theme.text.secondary,
        fontSize: '14px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        Rate this pool to contribute to its Pool Quality Score. Your vote requires wallet signature.
      </p>
      
      {/* Wyświetl średnią ocenę */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <Star size={18} fill={theme.accent.primary} color={theme.accent.primary} />
        <span style={{ 
          marginLeft: '4px', 
          color: theme.text.primary,
          fontWeight: '600'
        }}>
          {averageRating.toFixed(1)}
        </span>
        <span style={{ 
          marginLeft: '4px', 
          color: theme.text.secondary,
          fontSize: '14px'
        }}>
          ({totalVotes} vote{totalVotes !== 1 ? 's' : ''})
        </span>
      </div>
      
      {/* Gwiazdki do głosowania */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '12px',
        gap: '8px'
      }}>
        {renderStars()}
      </div>
      
      {/* Status głosowania */}
      {loading && (
        <div style={{ color: theme.text.secondary, fontSize: '14px' }}>
          Submitting your vote...
        </div>
      )}
      
      {error && (
        <div style={{ color: '#FF5757', fontSize: '14px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: '#4CAF50', fontSize: '14px' }}>
          Your vote has been recorded!
        </div>
      )}
      
      {!isConnected && (
        <div style={{ 
          color: theme.text.secondary, 
          fontSize: '14px',
          marginTop: '8px'
        }}>
          Connect your wallet to vote
        </div>
      )}
    </div>
  );
};

export default GravityVotePanel; 