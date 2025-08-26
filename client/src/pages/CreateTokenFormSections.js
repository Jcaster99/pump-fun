import { AlertTriangle, Edit, ImageIcon, Link, Plus, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const WalletNotConnectedView = ({ 
  connectWallet, 
  theme, 
  darkMode 
}) => {
  // Check if device is mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div style={{
      backgroundColor: darkMode ? 'rgba(10, 15, 25, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '24px',
      boxShadow: darkMode 
        ? '0 15px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(60, 70, 90, 0.3)' 
        : '0 15px 30px rgba(0,0,0,0.05), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      overflow: 'hidden',
      padding: isMobile ? '30px 20px' : '50px 30px',
      textAlign: 'center',
      maxWidth: isMobile ? '100%' : '600px',
      width: isMobile ? '100%' : 'auto',
      margin: '0 auto',
      backdropFilter: 'blur(15px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
      }}>
        <div style={{
          width: isMobile ? '120px' : '140px',
          height: isMobile ? '120px' : '140px', 
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: darkMode 
            ? `0 0 25px 5px ${theme.accent.primary}, 0 0 0 2px rgba(0, 210, 233, 0.3)` 
            : `0 0 25px 5px ${theme.accent.secondary}, 0 0 0 2px rgba(255, 92, 170, 0.3)`,
          border: darkMode 
            ? `3px solid ${theme.accent.primary}` 
            : `3px solid ${theme.accent.secondary}`,
          animation: 'pulse 2s infinite'
        }}>
          <img 
            src="/slop-img-logo.svg" 
            alt="Connect Wallet"
            onError={(e) => e.target.src = '/slop-img-logo.svg'} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '10px'
            }}
          />
        </div>
      </div>
      
      <h2 style={{ 
        fontSize: isMobile ? '24px' : '28px', 
        fontWeight: '700',
        color: theme.text.primary,
        marginBottom: '16px',
        textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
      }}>
        Wallet Connection Required
      </h2>
      
      <p style={{ 
        color: theme.text.secondary, 
        marginBottom: '30px',
        fontSize: isMobile ? '15px' : '16px',
        lineHeight: '1.6',
        maxWidth: '440px',
        margin: '0 auto 30px'
      }}>
        You need to connect your wallet to create a token.
        Access to token creation requires wallet authentication.
      </p>
      
      <button 
        onClick={connectWallet}
        style={{
          background: darkMode 
            ? `linear-gradient(135deg, ${theme.accent.primary}, #00D2FF)` 
            : `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: isMobile ? '14px 28px' : '16px 36px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: isMobile ? '15px' : '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: darkMode 
            ? '0 10px 20px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 210, 233, 0.2)' 
            : '0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(255, 92, 170, 0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 15px 30px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 210, 233, 0.3)' 
            : '0 15px 30px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(255, 92, 170, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 10px 20px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 210, 233, 0.2)' 
            : '0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(255, 92, 170, 0.15)';
        }}
      >
        Connect Wallet
      </button>
    </div>
  );
};

export const TokenDetailsSection = ({
  formData,
  formErrors,
  loading,
  activeField,
  caretPosition,
  handleInputEvent,
  handleFocusWithCaret,
  handleBlurWithCaret,
  getInputStyle,
  headingStyle,
  sectionStyle,
  labelStyle,
  theme,
  darkMode
}) => {
  return (
    <div className="form-section" style={sectionStyle}>
      <h3 style={headingStyle}>
        {/* <Sparkles size={22} color={darkMode ? theme.accent.primary : theme.accent.secondary} /> */}
        Token Details
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          Token Name *
        </label>
        <div className="input-container">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputEvent}
            onClick={handleInputEvent}
            onKeyUp={handleInputEvent}
            placeholder="Enter token name"
            style={{
              ...getInputStyle('name'),
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
            onFocus={(e) => handleFocusWithCaret(e, 'name')}
            onBlur={(e) => handleBlurWithCaret(e, 'name')}
            disabled={loading}
          />
          {activeField === 'name' && (
            <div 
              className="custom-caret" 
              style={{ 
                left: `${caretPosition.left}px`, 
                top: `${caretPosition.top}px` 
              }}
            />
          )}
        </div>
        {formErrors.name && (
          <div style={{ color: '#FF5757', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={15} />
            {formErrors.name}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          Symbol *
        </label>
        <div className="input-container">
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputEvent}
            onClick={handleInputEvent}
            onKeyUp={handleInputEvent}
            placeholder="Enter token symbol"
            style={{
              ...getInputStyle('symbol'),
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
            onFocus={(e) => handleFocusWithCaret(e, 'symbol')}
            onBlur={(e) => handleBlurWithCaret(e, 'symbol')}
            disabled={loading}
          />
          {activeField === 'symbol' && (
            <div 
              className="custom-caret" 
              style={{ 
                left: `${caretPosition.left}px`, 
                top: `${caretPosition.top}px` 
              }}
            />
          )}
        </div>
        {formErrors.symbol && (
          <div style={{ color: '#FF5757', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={15} />
            {formErrors.symbol}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={labelStyle}>
          Description
        </label>
        <div className="input-container">
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputEvent}
            onClick={handleInputEvent}
            onKeyUp={handleInputEvent}
            placeholder="Enter token description"
            style={{
              ...getInputStyle('description'),
              height: '120px',
              resize: 'vertical',
              padding: '18px',
              lineHeight: '1.6',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              borderRadius: '8px',
            }}
            onFocus={(e) => handleFocusWithCaret(e, 'description')}
            onBlur={(e) => handleBlurWithCaret(e, 'description')}
            disabled={loading}
          />
          {activeField === 'description' && (
            <div 
              className="custom-caret" 
              style={{ 
                left: `${caretPosition.left}px`, 
                top: '20px' 
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const SocialMediaSection = ({
  formData,
  formErrors,
  loading,
  activeField,
  caretPosition,
  handleInputEvent,
  handleFocusWithCaret,
  handleBlurWithCaret,
  getInputStyle,
  headingStyle,
  sectionStyle,
  labelStyle,
  theme,
  darkMode
}) => {
  return (
    <div className="form-section" style={sectionStyle}>
      <h3 style={headingStyle}>
        {/* <Link size={22} color={darkMode ? theme.accent.primary : theme.accent.secondary} /> */}
        Links (Optional)
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          project username
        </label>
        <div className="input-container">
          <input
            type="text"
            name="twitter_url"
            value={formData.twitter_url}
            onChange={handleInputEvent}
            onClick={handleInputEvent}
            onKeyUp={handleInputEvent}
            placeholder="project_x_name (without @)"
            style={{
              ...getInputStyle('twitter_url'),
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
            onFocus={(e) => handleFocusWithCaret(e, 'twitter_url')}
            onBlur={(e) => handleBlurWithCaret(e, 'twitter_url')}
            disabled={loading}
          />
          {activeField === 'twitter_url' && (
            <div 
              className="custom-caret" 
              style={{ 
                left: `${caretPosition.left}px`, 
                top: `${caretPosition.top}px` 
              }}
            />
          )}
        </div>
        {formErrors.twitter_url && (
          <div style={{ color: '#FF5757', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={15} />
            {formErrors.twitter_url}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={labelStyle}>
          Website URL
        </label>
        <div className="input-container">
          <input
            type="text"
            name="website_url"
            value={formData.website_url}
            onChange={handleInputEvent}
            onClick={handleInputEvent}
            onKeyUp={handleInputEvent}
            placeholder="project.xyz"
            style={{
              ...getInputStyle('website_url'),
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
            onFocus={(e) => handleFocusWithCaret(e, 'website_url')}
            onBlur={(e) => handleBlurWithCaret(e, 'website_url')}
            disabled={loading}
          />
          {activeField === 'website_url' && (
            <div 
              className="custom-caret" 
              style={{ 
                left: `${caretPosition.left}px`, 
                top: `${caretPosition.top}px` 
              }}
            />
          )}
        </div>
        {formErrors.website_url && (
          <div style={{ color: '#FF5757', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={15} />
            {formErrors.website_url}
          </div>
        )}
      </div>
    </div>
  );
};

export const TokenImageSection = ({
  image,
  imagePreview,
  loading,
  checking,
  handleImageChange,
  clearImage,
  formErrors,
  sectionStyle,
  headingStyle,
  theme,
  darkMode
}) => {

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const fileInputRef = React.useRef(null);
  
  return (
    <div className="form-section" style={{ ...sectionStyle, marginBottom: '32px', position: 'relative' }}>
      <h3 style={headingStyle}>
        {/* <ImageIcon size={22} color={darkMode ? theme.accent.primary : theme.accent.secondary} /> */}
        Token Image
      </h3>
      
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 20,
        alignItems: 'center',
        width: '100%',
      }}>
        <div style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: theme.bg.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          border: `2px dashed ${theme.accent.secondary}`,
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}>
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Token" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              color: theme.text.tertiary,
            }}>
              <Plus size={32} style={{ marginBottom: '8px', padding: 8, borderRadius: '50%', color: theme.text.primary, backgroundColor: theme.bg.card, border: `1px solid ${theme.border}` }} />
              <span style={{
                fontSize: '14px',
                textAlign: 'center',
                maxWidth: '120px',
              }}>
                Upload token image
              </span>
            </div>
          )}
        </div>
        
        <input 
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageChange}
          disabled={loading || checking}
        />
        
        <button
          type="button"
          onClick={() => {
            if (imagePreview) {
              // If we have an image and user clicks "Change Image", 
              // give the option to either select a new image or clear the current one
              if (window.confirm("Do you want to remove the current image?")) {
                clearImage();
              } else {
                fileInputRef.current.click();
              }
            } else {
              fileInputRef.current.click();
            }
          }}
          style={{
            backgroundColor: theme.bg.card,
            color: theme.text.primary,
            border: `1px solid ${theme.border}`,
            borderRadius: '1000px',
            padding: '10px 16px',
            cursor: (loading || checking) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
          onMouseEnter={(e) => {
            if (!loading && !checking) {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          disabled={loading || checking}
        >
          {imagePreview ? (
            <>
              <Edit size={16} />
              Change Image
            </>
          ) : (
            <>
              <Plus size={16} />
              Choose Image
            </>
          )}
        </button>
        
        {/* Display image size error if present */}
        {formErrors && formErrors.image && (
          <div style={{ 
            color: '#FF5757', 
            fontSize: '13px', 
            marginTop: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '7px',
            textAlign: 'center'
          }}>
            <AlertTriangle size={15} />
            {formErrors.image}
          </div>
        )}
        
        {checking && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 5,
            backdropFilter: 'blur(4px)',
            borderRadius: '20px',
          }}>
            <LoadingSpinner size={50} color={theme.accent.primary} />
            <p style={{ color: 'white', marginTop: '16px', fontWeight: '500' }}>
              Checking image...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const SubmitSection = ({
  loading,
  wallet,
  LISTING_FEE,
  buttonStyle,
  disabledButtonStyle,
  darkMode,
  theme
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '32px',
    }}>
      <button
        type="submit"
        style={loading ? disabledButtonStyle : buttonStyle}
        disabled={loading}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-3px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {loading ? (
          <>
            <LoadingSpinner size={22} color="#fff" />
            Processing...
          </>
        ) : (
          <>
            Create token for {LISTING_FEE} 0G
          </>
        )}
      </button>
    </div>
  );
}; 