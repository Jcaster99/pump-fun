import React, { useEffect, useState } from 'react';

const TransactionOverlay = ({ 
  transactionStep, 
  theme, 
  darkMode, 
  LISTING_FEE 
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (transactionStep) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [transactionStep]);
  
  if (!transactionStep) return null;
  
  let title = '';
  let description = '';
  let step = 0;
  
  switch(transactionStep) {
    case 'sending':
      title = 'Sending Payment';
      description = `Sending ${LISTING_FEE} 0G to treasury wallet`;
      step = 1;
      break;
    case 'confirming':
      title = 'Confirming Transaction';
      description = 'Waiting for blockchain confirmation';
      step = 2;
      break;
    case 'creating':
      title = 'Creating Token';
      description = 'Deploying token contract via lf0gFactory';
      step = 3;
      break;
    default:
      return null;
  }
  
  const progressSteps = [
    { name: 'Payment', active: step >= 1 },
    { name: 'Confirmation', active: step >= 2 },
    { name: 'Creation', active: step >= 3 }
  ];
  
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }} 
      />
      <div 
        className="transaction-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.95})`,
          backgroundColor: 'rgba(15, 20, 30, 0.95)',
          borderRadius: '24px',
          padding: '36px',
          maxWidth: '460px',
          width: '90%',
          textAlign: 'center',
          zIndex: 1001,
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
          opacity: visible ? 1 : 0,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* CSS do wyłączenia "laserowego" obramowania */}
        <style jsx="true">{`
          .transaction-modal::before {
            display: none !important;
            content: none !important;
            animation: none !important;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '28px',
          padding: '0 10px',
        }}>
          {progressSteps.map((s, idx) => (
            <React.Fragment key={s.name}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.active 
                    ? theme.accent.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  color: s.active ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.5s ease',
                  boxShadow: s.active 
                    ? '0 0 15px rgba(0, 210, 233, 0.4)'
                    : 'none',
                  border: s.active
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  {idx + 1}
                </div>
                <span style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  color: s.active 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: s.active ? '600' : '400',
                  letterSpacing: '0.5px',
                  transition: 'all 0.5s ease',
                }}>
                  {s.name}
                </span>
              </div>
              
              {idx < progressSteps.length - 1 && (
                <div style={{
                  height: '2px',
                  width: '60px',
                  backgroundColor: progressSteps[idx+1].active
                    ? theme.accent.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  alignSelf: 'center',
                  margin: '0 4px',
                  marginTop: '-8px',
                  transition: 'all 0.5s ease',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* GIF Animation */}
        <div style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'center',
        }}>
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(0, 210, 233, 0.3)',
          }}>
            <img 
              src="/around.gif" 
              alt="Loading" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.src = '';
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Title and Description */}
        <h2 style={{ 
          marginBottom: '16px', 
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '24px',
          fontWeight: '700',
          letterSpacing: '0.3px',
          animation: 'fadeIn 0.6s ease-out',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}>
          {title}
        </h2>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '16px',
          lineHeight: '1.6',
          fontWeight: '500',
          maxWidth: '320px',
          margin: '0 auto 28px auto',
          animation: 'fadeIn 0.7s ease-out',
        }}>
          {description}
        </p>
        
        {/* Status Box */}
        <div style={{
          marginTop: '28px',
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500',
          animation: 'fadeIn 0.8s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <p>Please wait while we process your request. This may take a minute.</p>
        </div>
      </div>
    </>
  );
};

export default TransactionOverlay; 