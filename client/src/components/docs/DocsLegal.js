import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Gavel, DollarSign, AlertTriangle } from 'lucide-react';

const ContentCard = ({ title, icon, children }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        position: 'relative',
      }}
      className="content-card"
    >
      <h2 style={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '16px',
        color: theme.text.primary
      }}>
        <span style={{ 
          color: theme.accent.primary,
          marginRight: '12px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {icon}
        </span>
        {title}
      </h2>
      
      {children}
    </div>
  );
};

const DocsLegal = ({ showOnlyFees = false }) => {
  const { theme } = useTheme();
  
  const textStyle = {
    marginBottom: '16px',
    lineHeight: 1.6,
    color: theme.text.primary,
    fontSize: '15px'
  };
  
  const listStyle = {
    paddingLeft: '20px',
    marginBottom: '16px',
  };
  
  const listItemStyle = {
    marginBottom: '8px',
    lineHeight: 1.6,
    color: theme.text.primary,
    fontSize: '15px'
  };

  const warningBoxStyle = {
    backgroundColor: 'rgba(237, 137, 54, 0.1)',
    borderLeft: '3px solid #ed8936',
    padding: '16px',
    marginBottom: '16px',
    borderRadius: '0 4px 4px 0',
    display: 'flex',
    alignItems: 'flex-start'
  };
  
  return (
    <div className="content-section">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: theme.text.secondary, fontSize: '14px' }}>
            Documentation / {showOnlyFees ? 'Fee Structure' : 'Legal Disclaimer'}
          </span>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text.primary }}>
          {showOnlyFees ? 'Fee Structure' : 'Legal Disclaimer'}
        </h1>
      </div>
      
      {showOnlyFees ? (
        <ContentCard title="Platform Fees" icon={<DollarSign size={20} />}>
          <p style={textStyle}>
            The following fees apply when using the lf0g.fun platform:
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: `rgba(0, 210, 233, 0.1)`,
                    color: theme.text.primary
                  }}>
                    Action
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: `rgba(0, 210, 233, 0.1)`,
                    color: theme.text.primary
                  }}>
                    Fee
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: `rgba(0, 210, 233, 0.1)`,
                    color: theme.text.primary
                  }}>
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    Create a token
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    0 OG
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    Only blockchain gas fees apply
                  </td>
                </tr>
                <tr>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    List a pool for trading
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    0.015 OG
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text.primary
                  }}>
                    Funds go to platform treasury
                  </td>
                </tr>
                <tr>
                  <td style={{ 
                    padding: '12px 16px', 
                    color: theme.text.primary
                  }}>
                    Re-list a delisted pool
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    color: theme.text.primary
                  }}>
                    0.015 OG
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    color: theme.text.primary
                  }}>
                    Same as initial listing fee
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ 
            fontSize: '17px', 
            fontWeight: '600', 
            marginTop: '24px', 
            marginBottom: '12px',
            color: theme.text.primary
          }}>
            Treasury Distribution
          </h3>
          
          <p style={textStyle}>
            50% of all fees collected are distributed weekly to the top 10 pool creators based on the following metrics:
          </p>
          
          <ul style={listStyle}>
            <li style={listItemStyle}>Market capitalization</li>
            <li style={listItemStyle}>Total liquidity</li>
            <li style={listItemStyle}>Number of transactions</li>
          </ul>
          
          <p style={textStyle}>
            This system rewards active creators and incentivizes the creation of high-quality, actively traded pools.
          </p>
          
          <div style={warningBoxStyle}>
            <span style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
              <AlertTriangle size={16} />
            </span>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>Note</strong>: Fees may be subject to change as the platform evolves. Any changes will be announced in advance through our official channels.
            </p>
          </div>
        </ContentCard>
      ) : (
        <>
          <ContentCard title="Legal Disclaimer" icon={<Gavel size={20} />}>
            <p style={textStyle}>
              Last Updated: April 5, 2025
            </p>
            
            <p style={textStyle}>
              Please read this disclaimer carefully before using the lf0g.fun platform. By accessing or using our platform, you acknowledge that you have read, understood, and agree to be bound by the terms of this disclaimer.
            </p>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              General Disclaimer
            </h3>
            
            <p style={textStyle}>
              lf0g.fun is an intermediary platform that enables users to create ERC-20 tokens and liquidity pools on the 0G Galileo Testnet blockchain. We do not own, control, or take responsibility for the tokens or pools created through our interface. Users are solely responsible for their activities on the platform.
            </p>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              Testnet Environment
            </h3>
            
            <p style={textStyle}>
              The platform operates on the 0G Galileo Testnet, which is a testing environment. All activities, tokens, and pools exist solely for testing and demonstration purposes. The platform may be subject to bugs, downtime, or other issues inherent in a testnet environment.
            </p>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              No Financial Advice
            </h3>
            
            <p style={textStyle}>
              Nothing on lf0g.fun constitutes financial advice, investment advice, trading advice, or any other advice. We do not recommend any token, pool, or trading strategy. All decisions to create, trade, or invest in tokens or pools are made solely by users at their own risk.
            </p>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              Risk Disclosure
            </h3>
            
            <p style={textStyle}>
              Creating and trading tokens, particularly on a testnet environment, involves significant risks, including but not limited to:
            </p>
            
            <ul style={listStyle}>
              <li style={listItemStyle}>Loss of funds due to technical issues</li>
              <li style={listItemStyle}>Smart contract vulnerabilities</li>
              <li style={listItemStyle}>Testnet resets or changes</li>
              <li style={listItemStyle}>Market volatility</li>
              <li style={listItemStyle}>Regulatory and legal risks</li>
            </ul>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              Limitation of Liability
            </h3>
            
            <p style={textStyle}>
              To the maximum extent permitted by law, lf0g.fun and its developers, operators, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses.
            </p>
            
            <h3 style={{ 
              fontSize: '17px', 
              fontWeight: '600', 
              marginTop: '20px', 
              marginBottom: '12px',
              color: theme.text.primary
            }}>
              Intellectual Property
            </h3>
            
            <p style={textStyle}>
              All content, design, graphics, interfaces, and other elements of the lf0g.fun platform are protected by intellectual property laws and belong to their respective owners. Users may not copy, modify, distribute, or create derivative works without explicit permission.
            </p>
            
            <div style={warningBoxStyle}>
              <span style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
                <AlertTriangle size={16} />
              </span>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Important</strong>: This legal disclaimer is subject to change. Any modifications will be effective immediately upon posting on the platform. Users are advised to review this disclaimer periodically.
              </p>
            </div>
          </ContentCard>
        </>
      )}
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '32px', 
        marginBottom: '16px',
        padding: '16px 0',
        borderTop: `1px solid ${theme.border}`,
        color: theme.text.secondary,
        fontSize: '14px'
      }}>
        <p>© 2025 lf0g.fun - All rights reserved</p>
      </div>
    </div>
  );
};

export default DocsLegal; 