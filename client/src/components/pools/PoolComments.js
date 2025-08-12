import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { fetchComments, createComment, likeComment } from '../../api/commentsApi';

// Animacja dla elementów komentarzy
const animationStyles = {
  container: {
    opacity: 0,
    animation: 'fadeInUp 0.5s ease-out forwards',
    animationDelay: '0.1s'
  },
  title: {
    opacity: 0,
    animation: 'fadeInUp 0.4s ease-out forwards',
    animationDelay: '0.1s'
  },
  commentForm: {
    opacity: 0,
    animation: 'fadeInUp 0.5s ease-out forwards',
    animationDelay: '0.2s'
  },
  commentList: {
    opacity: 0,
    animation: 'fadeInUp 0.6s ease-out forwards',
    animationDelay: '0.3s'
  },
  commentItem: (index) => ({
    opacity: 0,
    animation: 'fadeInUp 0.4s ease-out forwards',
    animationDelay: `${0.1 + (index * 0.05)}s`
  })
};

// Keyframes animacji
const animationKeyframes = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .comment-item {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
  }
  
  .comment-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }
`;

const PoolComments = ({ pool, theme, darkMode, onCommentsLoaded }) => {
  const { wallet, connectWallet, username, requestSignature } = useWallet();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [authenticating, setAuthenticating] = useState(false);
  const limit = 50;
  
  // Keep track of previous comments length to avoid unnecessary updates
  const prevCommentsLengthRef = useRef(0);
  const commentsFetchedRef = useRef(false);
  
  // Prefer token_address; fall back to contract_address
  const poolAddress = pool?.token_address || pool?.contract_address;
  
  // Modified: Only notify parent about comments count when it actually changes
  // and not on every render or comment length change
  useEffect(() => {
    // Only call the callback if comments length has changed and is different from prev value
    if (onCommentsLoaded && typeof onCommentsLoaded === 'function' && 
        comments.length !== prevCommentsLengthRef.current) {
      prevCommentsLengthRef.current = comments.length;
      onCommentsLoaded(comments.length);
    }
  }, [comments.length, onCommentsLoaded]);
  
  // Load initial comments
  useEffect(() => {
    // Reset fetch state when pool changes
    if (poolAddress) {
      commentsFetchedRef.current = false;
    }
    
    const loadComments = async () => {
      // Don't fetch if we've already fetched for this pool
      if (!poolAddress || commentsFetchedRef.current) return;
      
      try {
        setLoading(true);
        const response = await fetchComments(poolAddress, { limit, offset: 0 });
        
        if (response.success) {
          setComments(response.data);
          setHasMore(response.data.length < response.pagination.total);
          setOffset(response.data.length);
          // Mark that we've fetched comments for this pool
          commentsFetchedRef.current = true;
        } else {
          setError(response.error || 'Failed to load comments');
        }
      } catch (err) {
        console.error('Error loading comments:', err);
        setError('Error loading comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (poolAddress) {
      loadComments();
    }
  }, [poolAddress, limit]);
  
  // Load more comments
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const response = await fetchComments(poolAddress, { limit, offset });
      
      if (response.success) {
        setComments([...comments, ...response.data]);
        setOffset(offset + response.data.length);
        setHasMore(offset + response.data.length < response.pagination.total);
      } else {
        setError(response.error || 'Failed to load more comments');
      }
    } catch (err) {
      console.error('Error loading more comments:', err);
      setError('Error loading more comments. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    try {
      // Upewnij się, że data jest interpretowana jako UTC
      // SQLite używa formatu ISO-like bez strefy czasowej, więc dodajemy 'Z' aby oznaczyć UTC
      let dateStr = timestamp;
      
      // Jeśli timestamp nie kończy się na Z (UTC) lub +/- strefą czasową, uznajemy za UTC i dodajemy Z
      if (!/([+-]\d{2}:?\d{2}|Z)$/.test(dateStr)) {
        dateStr = dateStr + 'Z';
      }
      
      const now = new Date();
      const commentDate = new Date(dateStr);
      
      // Sprawdź czy data jest poprawna
      if (isNaN(commentDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      const diff = Math.floor((now - commentDate) / 1000); // różnica w sekundach
      const hours = commentDate.getHours();
      const minutes = commentDate.getMinutes();
      const amPm = hours >= 12 ? 'pm' : 'am';
      const formattedHours = hours % 12 || 12; // konwersja na format 12-godzinny
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      
      // W ciągu dnia: format godzinowy (np. 9:20 am)
      if (diff < 86400) { // mniej niż 24 godziny
        return `${formattedHours}:${formattedMinutes} ${amPm}`;
      } else {
        // Starsze niż 24h: format "X days ago"
        const days = Math.floor(diff / 86400);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      }
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'unknown time';
    }
  };
  
  // Handle posting a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!wallet) {
      connectWallet();
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    if (!username) {
      alert('You need to set up a username before commenting');
      return;
    }
    
    try {
      setAuthenticating(true);
      
      // Stwórz wiadomość do podpisania
      const message = `I am commenting on pool ${poolAddress} with text: ${commentText}`;
      
      // Podpisz wiadomość
      const signature = await requestSignature(message);
      
      // Wyślij komentarz wraz z podpisem
      const response = await createComment(poolAddress, {
        walletAddress: wallet.address,
        username: `@${username}`,
        text: commentText,
        signature
      });
      
      if (response.success) {
        // Add the new comment to the top of the list
        setComments([response.data, ...comments]);
        setCommentText('');
      } else {
        alert(response.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Error posting comment. Please try again later.');
    } finally {
      setAuthenticating(false);
    }
  };
  
  // Handle liking a comment
  const handleLikeComment = async (id) => {
    if (!wallet) {
      connectWallet();
      return;
    }
    
    try {
      // Stwórz wiadomość do podpisania
      const message = `I am liking comment ${id}`;
      
      // Podpisz wiadomość
      const signature = await requestSignature(message);
      
      // Wyślij like wraz z podpisem
      const response = await likeComment(id, wallet.address, signature);
      
      if (response.success) {
        // Update the comment like status and count
        setComments(comments.map(comment => {
          if (comment.id === id) {
            return {
              ...comment,
              isLiked: response.data.liked,
              likes: response.data.likeCount
            };
          }
          return comment;
        }));
      } else {
        alert(response.error || 'Failed to like comment');
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      alert('Error liking comment. Please try again later.');
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: theme.text.secondary,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px'
      }}>
        <div style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
          Loading comments...
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: '#FF5757',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        ...animationStyles.container
      }}>
        <p style={{ marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: theme.accent.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render comments
  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '24px',
          margin: '20px 0',
          color: theme.text.secondary,
          backgroundColor: darkMode ? 'rgba(30, 30, 42, 0.3)' : 'rgba(245, 245, 248, 0.5)',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          ...animationStyles.commentList
        }}>
          No comments yet. Be the first to comment!
        </div>
      );
    }
    
    return (
      <div style={{ ...animationStyles.commentList }}>
        {comments.map((comment, index) => (
          <div 
            key={comment.id} 
            className="comment-item"
            style={{
              padding: '16px',
              margin: '12px 0',
              borderRadius: '12px',
              backgroundColor: darkMode ? 'rgba(30, 30, 42, 0.3)' : 'rgba(245, 245, 248, 0.5)',
              border: `1px solid ${theme.border}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              ...animationStyles.commentItem(index)
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ 
                fontWeight: '600', 
                color: theme.accent.primary, 
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <img 
                  src="/dance.gif" 
                  alt="Zero dance"
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `1px solid ${theme.accent.primary}40`
                  }}
                />
                {comment.username}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: theme.text.secondary,
                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {formatTimeAgo(comment.created_at)}
              </div>
            </div>
            <div style={{ 
              margin: '12px 0', 
              color: theme.text.primary, 
              wordBreak: 'break-word',
              fontSize: '15px',
              lineHeight: '1.5'
            }}>
              {comment.text}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                onClick={() => handleLikeComment(comment.id)}
                style={{
                  backgroundColor: comment.isLiked 
                    ? (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') 
                    : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  color: comment.isLiked ? theme.accent.primary : theme.text.secondary,
                  padding: '6px 10px',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: comment.isLiked ? '600' : 'normal'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill={comment.isLiked ? "currentColor" : "none"}
                  />
                </svg>
                <span>{comment.likes}</span>
              </button>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <button 
              onClick={handleLoadMore}
              style={{
                backgroundColor: theme.accent.primary,
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '500',
                opacity: loadingMore ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Comments'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{animationKeyframes}</style>
      
      <div>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.text.primary,
          ...animationStyles.title
        }}>
          Community Discussion
        </h3>
        
        {/* Comment form */}
        <div style={{
          marginBottom: '24px',
          ...animationStyles.commentForm
        }}>
          <form onSubmit={handleSubmitComment}>
            <div style={{ 
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <textarea
                placeholder={wallet ? "Share your thoughts about this pool..." : "Connect wallet to comment"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!wallet || authenticating}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: theme.bg.panel,
                  border: `1px solid ${theme.border}`,
                  color: theme.text.primary,
                  resize: 'none',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  ':focus': {
                    borderColor: theme.accent.primary,
                    boxShadow: `0 0 0 2px ${theme.accent.primary}25`
                  }
                }}
              />
              <button
                type="submit"
                disabled={!wallet || !commentText.trim() || authenticating}
                style={{
                  padding: '12px 20px',
                  backgroundColor: theme.accent.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: wallet && commentText.trim() && !authenticating ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  opacity: wallet && commentText.trim() && !authenticating ? 1 : 0.5,
                  minWidth: '100px',
                  height: '48px',
                  transition: 'opacity 0.3s ease, background-color 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  transform: wallet && commentText.trim() && !authenticating ? 'translateY(0)' : 'translateY(0)'
                }}
              >
                {authenticating ? 'Verifying...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
        
        {renderComments()}
      </div>
    </>
  );
};

export default PoolComments; 