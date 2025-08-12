import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Rocket, Layers, Star, PaintBucket, Droplets, List, DollarSign, AlertTriangle, Mail, Award, TrendingUp, BarChart, Zap, Info } from 'lucide-react';

const ContentCard = ({ title, icon, children }) => {
  const { theme, darkMode } = useTheme();
  
  // Use the appropriate accent color based on theme mode
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;
  
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
          color: accentColor,
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

const DocsMainContent = () => {
  const { theme, darkMode } = useTheme();
  
  // Use the appropriate accent color based on theme mode
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;
  
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

  const infoBoxStyle = {
    backgroundColor: darkMode ? `rgba(0, 210, 233, 0.1)` : `rgba(255, 92, 170, 0.1)`,
    borderLeft: `3px solid ${accentColor}`,
    padding: '16px',
    marginBottom: '16px',
    borderRadius: '0 4px 4px 0',
    display: 'flex',
    alignItems: 'flex-start'
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

  const codeStyle = {
    fontFamily: 'monospace',
    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '14px'
  };
  
  return (
    <div className="content-section">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: theme.text.secondary, fontSize: '14px' }}>
            Documentation / Main Documentation
          </span>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text.primary }}>
          lf0g.fun Documentation
        </h1>
      </div>
      
      <ContentCard title="Introduction" icon={<Rocket size={20} />}>
        <p style={textStyle}>
          Welcome to lf0g.fun, a decentralized platform on 0G Galileo Testnet that enables users to create and trade ERC-20 tokens with an innovative bonding curve mechanism and streamlined liquidity pool creation process.
        </p>
        
        <p style={textStyle}>
          lf0g.fun serves as an intermediary platform that facilitates token creation, bonding curve trading, and eventual graduation to standard liquidity pools. We do not own or control the tokens or pools created through our interface - we simply provide the tools to interact with the blockchain.
        </p>
      </ContentCard>
      
      <ContentCard title="Platform Overview" icon={<Layers size={20} />}>
        <p style={textStyle}>
          lf0g.fun is distinct from zer0_dex, offering complementary functionality focused on token creation and liquidity provision through bonding curves. Our innovative approach provides equal opportunities for all participants, with success being determined by community engagement and project promotion.
        </p>
      </ContentCard>
      
      <ContentCard title="Key Features" icon={<Star size={20} />}>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Bonding Curve Tokens</strong>: Create tokens with automatic price discovery through a bonding curve mechanism</li>
          <li style={listItemStyle}><strong>Gravity Score System</strong>: Measure and reward project popularity and community engagement</li>
          <li style={listItemStyle}><strong>Graduation System</strong>: Transition from bonding curve to standard liquidity pool trading</li>
          <li style={listItemStyle}><strong>Creator Rewards</strong>: Unlock token allocations for creators based on project growth</li>
          <li style={listItemStyle}><strong>Fair Launch</strong>: Equal starting point for all projects with success determined by promotion efforts</li>
          <li style={listItemStyle}><strong>Permanent Liquidity</strong>: LP tokens from graduated projects are burned, ensuring permanent liquidity</li>
        </ul>
      </ContentCard>

      <ContentCard title="Bonding Curve Mechanism" icon={<TrendingUp size={20} />}>
        <p style={textStyle}>
          A bonding curve is a mathematical pricing mechanism where token price is determined by the token's supply. In lf0g.fun's implementation:
        </p>

        <ul style={listStyle}>
          <li style={listItemStyle}>The price increases when users buy tokens and decreases when they sell</li>
          <li style={listItemStyle}>Initial virtual reserves are set to 100,000 USDT and 1,888,888,888 tokens</li>
          <li style={listItemStyle}>Price is determined by the formula: <span style={codeStyle}>price = usdtReserves / tokenReserves</span></li>
          <li style={listItemStyle}>A constant product formula is used: <span style={codeStyle}>k = usdtReserves * tokenReserves</span></li>
          <li style={listItemStyle}>All transactions incur a 0.1% fee in USDT, which goes to the treasury</li>
          <li style={listItemStyle}>5% of total supply is reserved for the creator, unlocked gradually as Gravity Score increases</li>
        </ul>

        <div style={infoBoxStyle}>
          <div style={{ color: accentColor, marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Bonding curves provide automated price discovery, continuous liquidity, and a mathematically fair distribution model.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Gravity Score System" icon={<BarChart size={20} />}>
        <p style={textStyle}>
          Gravity Score is a comprehensive metric from 0 to 1000 that measures a token's popularity, activity, and potential. It influences creator token unlocking and is essential for graduation eligibility.
        </p>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Score Components
        </h3>

        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Market Cap (70%)</strong>: 1 point for every $100 in market cap, capped at 700 points</li>
          <li style={listItemStyle}><strong>Curve Utilization (10%)</strong>: Percentage of tokens sold from the bonding curve</li>
          <li style={listItemStyle}><strong>Holder Metrics (8%)</strong>: Logarithmic scale based on number of unique holders</li>
          <li style={listItemStyle}><strong>Price Stability (5%)</strong>: Evaluation of price volatility over a 7-day period</li>
          <li style={listItemStyle}><strong>Community Activity (7%)</strong>: Combination of comments, votes, and transaction metrics</li>
        </ul>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Creator Token Unlocking
        </h3>

        <p style={textStyle}>
          As your token's Gravity Score increases, portions of the creator's 5% allocation are unlocked:
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
                  Gravity Score Threshold
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  borderBottom: `1px solid ${theme.border}`,
                  backgroundColor: `rgba(0, 210, 233, 0.1)`,
                  color: theme.text.primary
                }}>
                  Unlocked Percentage
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
                  200
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  5% of creator reserve
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  400
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  10% of creator reserve
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  600
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  20% of creator reserve
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  800
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  30% of creator reserve
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  color: theme.text.primary
                }}>
                  1000
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  color: theme.text.primary
                }}>
                  35% of creator reserve
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ContentCard>
      
      <ContentCard title="Graduation System" icon={<Award size={20} />}>
        <p style={textStyle}>
          Graduation is the process of transitioning a token from bonding curve trading to a standard liquidity pool on swap.lf0g.fun. This milestone represents a token's maturity and community adoption.
        </p>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Graduation Requirements
        </h3>

        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Bonding Curve Utilization</strong>: Minimum 75% of tokens sold from the curve</li>
          <li style={listItemStyle}><strong>Holder Count</strong>: Minimum 10 unique token holders</li>
          <li style={listItemStyle}><strong>Token Age</strong>: Token must be at least 7 days old</li>
          <li style={listItemStyle}><strong>Gravity Score</strong>: Minimum score of 600 points</li>
        </ul>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Graduation Process
        </h3>

        <p style={textStyle}>
          When a token meets all graduation requirements, the creator can trigger the graduation process:
        </p>

        <ol style={listStyle}>
          <li style={listItemStyle}>Bonding curve trading is permanently disabled</li>
          <li style={listItemStyle}>20% of the token's current supply is minted to provide liquidity</li>
          <li style={listItemStyle}>All USDT from the bonding curve is paired with the new tokens</li>
          <li style={listItemStyle}>A new liquidity pool is created on swap.lf0g.fun</li>
          <li style={listItemStyle}>100% of the LP tokens are burned, ensuring permanent liquidity</li>
        </ol>

        <div style={warningBoxStyle}>
          <span style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
            <AlertTriangle size={16} />
          </span>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Important</strong>: Graduation is irreversible. Once a token graduates, it can only be traded through its liquidity pool, not through the bonding curve.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Token Creation Process" icon={<PaintBucket size={20} />}>
        <p style={textStyle}>
          Creating a bonding curve token is a straightforward process:
        </p>

        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to the "Create Token" section</li>
          <li style={listItemStyle}>Configure your token parameters (name, symbol, description)</li>
          <li style={listItemStyle}>Pay the token creation fee (0.015 OG)</li>
          <li style={listItemStyle}>Confirm the transaction to deploy your token</li>
        </ol>

        <p style={textStyle}>
          After creation, your token will have:
        </p>

        <ul style={listStyle}>
          <li style={listItemStyle}>Initial virtual reserves: 100,000 USDT and 1,888,888,888 tokens</li>
          <li style={listItemStyle}>A 5% creator allocation that unlocks based on Gravity Score</li>
          <li style={listItemStyle}>Immediate trading availability through the bonding curve</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Fees" icon={<DollarSign size={20} />}>
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
                  0.015 OG
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  Bonding curve transactions
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text.primary
                }}>
                  0.1% in USDT
                </td>
              </tr>
              <tr>
                <td style={{ 
                  padding: '12px 16px', 
                  color: theme.text.primary
                }}>
                  Trading graduated tokens
                </td>
                <td style={{ 
                  padding: '12px 16px', 
                  color: theme.text.primary
                }}>
                  0% (no fee)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={textStyle}>
          All fees collected go to the treasury, which is used to reward active creators through various incentive programs.
        </p>
      </ContentCard>
      
      <ContentCard title="Benefits of Our Approach" icon={<Zap size={20} />}>
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          For Token Creators
        </h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Fair and equal starting point for all projects</li>
          <li style={listItemStyle}>Automatic price discovery through the bonding curve</li>
          <li style={listItemStyle}>Incentives for community building and project promotion</li>
          <li style={listItemStyle}>Ability to unlock creator tokens based on project performance</li>
          <li style={listItemStyle}>Seamless transition to standard liquidity pools after graduation</li>
        </ul>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          For Token Traders
        </h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Guaranteed liquidity through the bonding curve mechanism</li>
          <li style={listItemStyle}>Transparent price discovery based on supply and demand</li>
          <li style={listItemStyle}>Gravity Score as an objective measure of project quality</li>
          <li style={listItemStyle}>Zero trading fees on graduated tokens</li>
          <li style={listItemStyle}>Permanent liquidity for graduated tokens due to LP burning</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Disclaimer" icon={<AlertTriangle size={20} />}>
        <p style={textStyle}>
          lf0g.fun is an intermediary platform that allows users to create tokens and pools on the 0G Galileo Testnet. We do not own, control, or take responsibility for the tokens or pools created through our interface. Users are solely responsible for their activities on the platform.
        </p>
        
        <p style={textStyle}>
          The platform is currently in testnet phase and may be subject to bugs, downtime, or other issues. Use at your own risk and do not use real funds with significant value.
        </p>
      </ContentCard>
      
      <ContentCard title="Contact" icon={<Mail size={20} />}>
        <p style={textStyle}>
          For support or questions, please reach out through our official channels.
        </p>
      </ContentCard>
      
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

export default DocsMainContent; 