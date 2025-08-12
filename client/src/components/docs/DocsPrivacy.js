import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Shield, AlertTriangle } from 'lucide-react';

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

const DocsPrivacy = () => {
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
            Documentation / Privacy Policy
          </span>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text.primary }}>
          Privacy Policy
        </h1>
      </div>
      
      <ContentCard title="Privacy Policy Overview" icon={<Shield size={20} />}>
        <p style={textStyle}>
          Last Updated: April 5, 2025
        </p>
        
        <p style={textStyle}>
          At lf0g.fun, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
        </p>
        
        <div style={warningBoxStyle}>
          <span style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
            <AlertTriangle size={16} />
          </span>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Important Note</strong>: lf0g.fun operates on a public blockchain. Most interactions with our platform are publicly visible on the blockchain and cannot be deleted or modified.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Information We Collect" icon={<Shield size={20} />}>
        <p style={textStyle}>
          We collect the following types of information:
        </p>
        
        <h3 style={{ 
          fontSize: '17px', 
          fontWeight: '600', 
          marginTop: '20px', 
          marginBottom: '12px',
          color: theme.text.primary
        }}>
          Public Blockchain Data
        </h3>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>Wallet addresses</li>
          <li style={listItemStyle}>Transaction data (timestamps, amounts, contract interactions)</li>
          <li style={listItemStyle}>Smart contract data (token parameters, pool configurations)</li>
          <li style={listItemStyle}>On-chain messages and metadata</li>
        </ul>
        
        <h3 style={{ 
          fontSize: '17px', 
          fontWeight: '600', 
          marginTop: '20px', 
          marginBottom: '12px',
          color: theme.text.primary
        }}>
          Usage Data
        </h3>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>IP addresses</li>
          <li style={listItemStyle}>Browser and device information</li>
          <li style={listItemStyle}>Access times and pages visited</li>
          <li style={listItemStyle}>Features and functions used</li>
        </ul>
        
        <h3 style={{ 
          fontSize: '17px', 
          fontWeight: '600', 
          marginTop: '20px', 
          marginBottom: '12px',
          color: theme.text.primary
        }}>
          User-Provided Information
        </h3>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>Usernames and profile information (if provided)</li>
          <li style={listItemStyle}>Communication data from support requests</li>
          <li style={listItemStyle}>Custom token and pool metadata</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="How We Use Your Information" icon={<Shield size={20} />}>
        <p style={textStyle}>
          We use the collected information for the following purposes:
        </p>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>To provide and maintain our platform</li>
          <li style={listItemStyle}>To process transactions and display relevant blockchain data</li>
          <li style={listItemStyle}>To detect, prevent, and address technical issues</li>
          <li style={listItemStyle}>To improve our user experience and services</li>
          <li style={listItemStyle}>To communicate with users and provide support</li>
          <li style={listItemStyle}>To comply with legal obligations</li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Data Sharing and Disclosure" icon={<Shield size={20} />}>
        <p style={textStyle}>
          We may share your information in the following situations:
        </p>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Public Blockchain Data</strong>: All on-chain data is publicly accessible on the blockchain and not under our control
          </li>
          <li style={listItemStyle}>
            <strong>Service Providers</strong>: With trusted third-party service providers who assist us in operating our platform
          </li>
          <li style={listItemStyle}>
            <strong>Legal Requirements</strong>: When required by law, regulation, or legal process
          </li>
          <li style={listItemStyle}>
            <strong>Analytics</strong>: Aggregated or anonymized data with analytics providers to improve our services
          </li>
        </ul>
      </ContentCard>
      
      <ContentCard title="Your Privacy Rights" icon={<Shield size={20} />}>
        <p style={textStyle}>
          Depending on your location, you may have certain rights regarding your personal data:
        </p>
        
        <ul style={listStyle}>
          <li style={listItemStyle}>Right to access your personal data</li>
          <li style={listItemStyle}>Right to correct inaccurate data</li>
          <li style={listItemStyle}>Right to request deletion of your data (with limitations for blockchain data)</li>
          <li style={listItemStyle}>Right to restrict or object to processing</li>
          <li style={listItemStyle}>Right to data portability</li>
        </ul>
        
        <div style={warningBoxStyle}>
          <span style={{ color: '#ed8936', marginRight: '12px', marginTop: '2px' }}>
            <AlertTriangle size={16} />
          </span>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Note</strong>: Due to the nature of blockchain technology, some data cannot be modified or deleted once recorded on the blockchain. This includes transaction history, token creation data, and pool interactions.
          </p>
        </div>
      </ContentCard>
      
      <ContentCard title="Security Measures" icon={<Shield size={20} />}>
        <p style={textStyle}>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
        </p>
        
        <p style={textStyle}>
          However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
        </p>
      </ContentCard>
      
      <ContentCard title="Updates to This Policy" icon={<Shield size={20} />}>
        <p style={textStyle}>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify users of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
        
        <p style={textStyle}>
          We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
        </p>
      </ContentCard>
      
      <ContentCard title="Contact Us" icon={<Shield size={20} />}>
        <p style={textStyle}>
          If you have questions or concerns about this Privacy Policy or our data practices, please contact us through our official channels.
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

export default DocsPrivacy; 