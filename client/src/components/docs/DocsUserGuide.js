import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Rocket, ClipboardCheck, Wallet, Coins, Droplets, Plus, List, Info, BarChart, ArrowUpRight, TrendingUp, Award, Gift } from 'lucide-react';

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

const DocsUserGuide = () => {
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
  
  return (
    <div className="content-section">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: theme.text.secondary, fontSize: '14px' }}>
            Documentation / User Guide
          </span>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text.primary }}>
          lf0g.fun User Guide
        </h1>
      </div>
      
      <ContentCard title="Getting Started" icon={<Rocket size={20} />}>
        <p style={textStyle}>
          Welcome to lf0g.fun, your gateway to creating and managing tokens with our innovative bonding curve mechanism on the 0G Galileo Testnet. This guide will walk you through the complete process from token creation to graduation and beyond.
        </p>

        <div style={infoBoxStyle}>
          <div style={{ color: accentColor, marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Our platform offers a unique approach where all tokens use a bonding curve mechanism for initial trading before graduating to standard liquidity pools when they reach specific milestones.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Prerequisites" icon={<ClipboardCheck size={20} />}>
        <p style={textStyle}>
          Before you begin, make sure:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>You have a Web3 wallet like MetaMask installed</li>
          <li style={listItemStyle}>Your wallet should be connected to the 0G Galileo Testnet</li>
          <li style={listItemStyle}>You should have some testnet OG for gas fees and the token creation fee (0.015 OG)</li>
          <li style={listItemStyle}>You understand the basics of bonding curves and our graduation system</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Connecting Your Wallet" icon={<Wallet size={20} />}>
        <ol style={listStyle}>
          <li style={listItemStyle}>Visit <a href="https://lf0g.fun" style={{ color: accentColor, textDecoration: 'none' }}>lf0g.fun</a></li>
          <li style={listItemStyle}>Click the "Connect Wallet" button in the top right corner</li>
          <li style={listItemStyle}>Select your wallet provider</li>
          <li style={listItemStyle}>Approve the connection request</li>
        </ol>
      </ContentCard>
      
      <ContentCard title="Token Creation" icon={<Coins size={20} />}>
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Creating a Bonding Curve Token
        </h3>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to the "Create Token" section</li>
          <li style={listItemStyle}>Fill in the token details:
            <ul style={{ marginTop: '8px' }}>
              <li style={{ ...listItemStyle, marginBottom: '4px' }}>Token Name</li>
              <li style={{ ...listItemStyle, marginBottom: '4px' }}>Token Symbol</li>
              <li style={{ ...listItemStyle, marginBottom: '4px' }}>Description</li>
            </ul>
          </li>
          <li style={listItemStyle}>Review your token settings</li>
          <li style={listItemStyle}>Click "Create Token"</li>
          <li style={listItemStyle}>Pay the token creation fee (0.015 OG)</li>
          <li style={listItemStyle}>Confirm the transaction in your wallet</li>
          <li style={listItemStyle}>Wait for the transaction to be confirmed</li>
          <li style={listItemStyle}><strong>Important</strong>: Save your token contract address</li>
        </ol>

        <div style={infoBoxStyle}>
          <div style={{ color: accentColor, marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Your token will be created with the bonding curve mechanism already in place, with initial virtual reserves of 100,000 USDT and 1,888,888,888 tokens. 5% of the total supply is reserved for you as the creator.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Using the Bonding Curve" icon={<TrendingUp size={20} />}>
        <p style={textStyle}>
          After creating your token, it's immediately available for trading through the bonding curve mechanism:
        </p>
        
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Buying Tokens
        </h3>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to your token's page or the "Trade" section</li>
          <li style={listItemStyle}>Enter the amount of USDT you want to spend</li>
          <li style={listItemStyle}>The system will automatically calculate how many tokens you'll receive</li>
          <li style={listItemStyle}>Click "Buy" and confirm the transaction</li>
          <li style={listItemStyle}>Note that all purchases include a 0.1% fee in USDT</li>
        </ol>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginTop: '20px', marginBottom: '12px', color: theme.text.primary }}>
          Selling Tokens
        </h3>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to your token's page or the "Trade" section</li>
          <li style={listItemStyle}>Enter the amount of tokens you want to sell</li>
          <li style={listItemStyle}>The system will automatically calculate how much USDT you'll receive</li>
          <li style={listItemStyle}>Click "Sell" and confirm the transaction</li>
          <li style={listItemStyle}>Note that all sales include a 0.1% fee in USDT</li>
        </ol>

        <div style={infoBoxStyle}>
          <div style={{ color: accentColor, marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Remember that the price increases when people buy tokens and decreases when they sell. This is the fundamental principle of the bonding curve mechanism.
          </p>
        </div>
      </ContentCard>

      <ContentCard title="Monitoring Gravity Score" icon={<BarChart size={20} />}>
        <p style={textStyle}>
          Gravity Score is a comprehensive metric that measures your token's popularity, activity, and potential. It affects creator token unlocking and graduation eligibility.
        </p>
        
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Checking Your Gravity Score
        </h3>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to your token's detail page</li>
          <li style={listItemStyle}>Look for the Gravity Score section, which shows the current score and a breakdown of components</li>
          <li style={listItemStyle}>Monitor how your score changes over time</li>
        </ol>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginTop: '20px', marginBottom: '12px', color: theme.text.primary }}>
          Improving Your Gravity Score
        </h3>
        
        <p style={textStyle}>
          To increase your token's Gravity Score:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Promote your token to increase market cap and trading volume</li>
          <li style={listItemStyle}>Encourage adoption to increase the number of unique holders</li>
          <li style={listItemStyle}>Foster community engagement through comments and ratings</li>
          <li style={listItemStyle}>Aim for price stability to improve that component of the score</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Claiming Creator Tokens" icon={<Gift size={20} />}>
        <p style={textStyle}>
          As your token's Gravity Score increases, you can claim portions of your 5% creator allocation:
        </p>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to your token's detail page</li>
          <li style={listItemStyle}>Look for the "Creator Rewards" section</li>
          <li style={listItemStyle}>Check for any unlocked tokens based on your current Gravity Score</li>
          <li style={listItemStyle}>Click "Claim Tokens" when available</li>
          <li style={listItemStyle}>Confirm the transaction in your wallet</li>
        </ol>

        <div style={infoBoxStyle}>
          <div style={{ color: accentColor, marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Token unlocking thresholds: 5% at 200 points, 10% at 400 points, 20% at 600 points, 30% at 800 points, and 35% at 1000 points.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Graduation Process" icon={<Award size={20} />}>
        <p style={textStyle}>
          When your token meets all graduation requirements, you can migrate it from the bonding curve to a standard liquidity pool:
        </p>
        
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px', color: theme.text.primary }}>
          Graduation Requirements
        </h3>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>Minimum 75% of tokens sold from the bonding curve</li>
          <li style={listItemStyle}>At least 10 unique token holders</li>
          <li style={listItemStyle}>Token age of at least 7 days</li>
          <li style={listItemStyle}>Gravity Score of at least 600 points</li>
        </ul>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginTop: '20px', marginBottom: '12px', color: theme.text.primary }}>
          Initiating Graduation
        </h3>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Navigate to your token's detail page</li>
          <li style={listItemStyle}>Check the graduation requirements status (all must be met)</li>
          <li style={listItemStyle}>Click the "Graduate Token" button</li>
          <li style={listItemStyle}>Review the graduation confirmation modal</li>
          <li style={listItemStyle}>Confirm the graduation transaction in your wallet</li>
          <li style={listItemStyle}>Wait for the transaction to be confirmed</li>
        </ol>

        <h3 style={{ fontSize: '17px', fontWeight: '600', marginTop: '20px', marginBottom: '12px', color: theme.text.primary }}>
          Post-Graduation
        </h3>
        
        <p style={textStyle}>
          After graduation:
        </p>
        <ul style={listStyle}>
          <li style={listItemStyle}>Bonding curve trading is permanently disabled</li>
          <li style={listItemStyle}>Your token is now tradable on swap.lf0g.fun with 0% fees</li>
          <li style={listItemStyle}>All liquidity is permanently locked (LP tokens are burned)</li>
          <li style={listItemStyle}>Your token has officially "made it" to the next stage</li>
        </ul>

        <div style={warningBoxStyle}>
          <div style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Important</strong>: Graduation is irreversible. Once you graduate your token, it can never return to bonding curve trading.
          </p>
        </div>
      </ContentCard>

      <ContentCard title="Trading Graduated Tokens" icon={<ArrowUpRight size={20} />}>
        <p style={textStyle}>
          To trade tokens that have graduated from the bonding curve:
        </p>
        
        <ol style={listStyle}>
          <li style={listItemStyle}>Visit <a href="https://swap.lf0g.fun" style={{ color: accentColor, textDecoration: 'none' }}>swap.lf0g.fun</a></li>
          <li style={listItemStyle}>Connect your wallet</li>
          <li style={listItemStyle}>Select the tokens you want to swap</li>
          <li style={listItemStyle}>Enter the amount and review the exchange rate</li>
          <li style={listItemStyle}>Click "Swap" and confirm the transaction</li>
          <li style={listItemStyle}>Enjoy 0% trading fees on all graduated tokens</li>
        </ol>
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

export default DocsUserGuide; 