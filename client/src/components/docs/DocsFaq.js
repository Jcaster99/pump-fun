import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FaqItem = ({ question, answer }) => {
  const { theme, darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // Use the appropriate accent color based on theme mode
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;

  return (
    <div style={{
      marginBottom: '16px',
      borderBottom: `1px solid ${theme.border}`,
      paddingBottom: '16px'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          padding: '8px 0',
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.text.primary,
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        <span>{question}</span>
        {isOpen ? 
          <ChevronUp size={18} color={accentColor} /> : 
          <ChevronDown size={18} color={theme.text.secondary} />
        }
      </button>
      
      {isOpen && (
        <div style={{
          padding: '8px 0',
          color: theme.text.secondary,
          fontSize: '15px',
          lineHeight: 1.6
        }}>
          {answer}
        </div>
      )}
    </div>
  );
};

const DocsFaq = () => {
  const { theme, darkMode } = useTheme();
  
  // Use the appropriate accent color based on theme mode
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;
  
  const faqItems = [
    {
      question: "What is lf0g.fun?",
      answer: "lf0g.fun is a decentralized platform on 0G Galileo Testnet that enables users to create and trade ERC-20 tokens using an innovative bonding curve mechanism. It offers a fair launch process with automated price discovery and a path to graduation for mature projects."
    },
    {
      question: "What is a bonding curve?",
      answer: "A bonding curve is a mathematical formula that automatically determines token price based on supply. In lf0g.fun, when users buy tokens, the price increases; when they sell, the price decreases. This provides continuous liquidity and fair, transparent price discovery from day one."
    },
    {
      question: "How does Gravity Score work?",
      answer: "Gravity Score is a comprehensive metric (0-1000) that measures a token's popularity, activity, and potential. It's calculated from market cap (70%), curve utilization (10%), holder metrics (8%), price stability (5%), and community activity (7%). A higher score unlocks creator token rewards and enables graduation eligibility."
    },
    {
      question: "What is token graduation?",
      answer: "Graduation is the process of transitioning a token from bonding curve trading to a standard liquidity pool on swap.lf0g.fun. It requires meeting specific criteria: 75% tokens sold from curve, 10+ unique holders, 7+ days token age, and 600+ Gravity Score. After graduation, bonding curve trading is disabled, and the token trades with 0% fees."
    },
    {
      question: "What happens to liquidity during graduation?",
      answer: "During graduation, 20% of the token's current supply is minted and paired with all USDT from the bonding curve to create a new liquidity pool. 100% of the LP tokens are burned, ensuring permanent liquidity that benefits all traders and can never be removed."
    },
    {
      question: "How much does it cost to create a token?",
      answer: "Creating a token costs 0.015 OG. Additionally, all bonding curve transactions incur a 0.1% fee in USDT. After graduation, trading the token has 0% fees on swap.lf0g.fun."
    },
    {
      question: "How does the creator token reward system work?",
      answer: "Token creators receive a 5% allocation of the total supply. This allocation is unlocked gradually as the token's Gravity Score increases: 5% at 200 points, 10% at 400 points, 20% at 600 points, 30% at 800 points, and 35% at 1000 points. This incentivizes creators to promote their projects and build community."
    },
    {
      question: "Why is this model beneficial for traders?",
      answer: "The bonding curve model benefits traders by providing guaranteed liquidity from day one, transparent price discovery, and equal access for all participants. The Gravity Score helps identify quality projects, and after graduation, tokens trade with 0% fees and permanent liquidity."
    },
    {
      question: "Can I reverse the graduation process?",
      answer: "No, graduation is irreversible. Once a token graduates from the bonding curve to a standard liquidity pool, it can never return to bonding curve trading. This ensures the project's continued stability and liquidity for all token holders."
    },
    {
      question: "What are the virtual reserves in the bonding curve?",
      answer: "The bonding curve is initialized with virtual reserves of 100,000 USDT and 1,888,888,888 tokens. These virtual reserves establish the initial price and determine how price changes with purchases and sales. They are part of the mathematical formula that powers the bonding curve."
    },
    {
      question: "What happens to the fees collected?",
      answer: "All fees collected (0.015 OG for token creation and 0.1% USDT from bonding curve transactions) go to the treasury. These funds are used to reward active creators and incentivize project growth in the ecosystem."
    },
    {
      question: "Is lf0g.fun suitable for beginners?",
      answer: "Yes, lf0g.fun is designed to make token creation and trading accessible to users with varying levels of experience. The bonding curve automates price discovery, eliminating the need for complex liquidity management, while our step-by-step process and intuitive interface simplify token creation."
    },
    {
      question: "Does lf0g.fun own my token after I create it?",
      answer: "No, lf0g.fun is an intermediary platform that provides tools to interact with the blockchain. We do not own or control the tokens or pools created through our interface. Token creators retain full ownership and responsibility for their projects."
    }
  ];

  return (
    <div className="content-section">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: theme.text.secondary, fontSize: '14px' }}>
            Documentation / FAQ
          </span>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text.primary }}>
          Frequently Asked Questions
        </h1>
      </div>
      
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <HelpCircle size={20} color={accentColor} style={{ marginRight: '12px' }} />
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Common Questions
          </h2>
        </div>
        
        <div>
          {faqItems.map((item, index) => (
            <FaqItem 
              key={index} 
              question={item.question} 
              answer={item.answer} 
            />
          ))}
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: theme.text.primary
        }}>
          Still Have Questions?
        </h3>
        
        <p style={{ 
          color: theme.text.primary,
          marginBottom: '16px',
          fontSize: '15px',
          lineHeight: 1.6
        }}>
          If you couldn't find an answer to your question, feel free to reach out through our official channels:
        </p>
        
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{
            marginBottom: '8px',
            color: theme.text.primary,
            fontSize: '15px'
          }}>
            <a 
              href="https://discord.gg/udY4b8gD" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: accentColor, textDecoration: 'none' }}
            >
              Discord Community
            </a>
          </li>
          <li style={{
            color: theme.text.primary,
            fontSize: '15px'
          }}>
            <a 
              href="https://github.com/desu777" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: accentColor, textDecoration: 'none' }}
            >
              GitHub Repository
            </a>
          </li>
        </ul>
      </div>
      
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

export default DocsFaq; 