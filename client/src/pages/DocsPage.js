import { ChevronRight, Coins, FileText, Gavel, HelpCircle, Info, MessageCircle, Shield } from 'lucide-react';
import React, { useState } from 'react';
import DocsFaq from '../components/docs/DocsFaq';
import DocsLegal from '../components/docs/DocsLegal';
import DocsMainContent from '../components/docs/DocsMainContent';
import DocsPrivacy from '../components/docs/DocsPrivacy';
import DocsUserGuide from '../components/docs/DocsUserGuide';
import { useTheme } from '../context/ThemeContext';

const DocsPage = () => {
  const { theme, darkMode } = useTheme();
  const [activeSection, setActiveSection] = useState('main-doc');

  // Navigation sections
  const sections = [
    {
      title: 'Introduction',
      items: [
        { id: 'main-doc', label: 'Main Documentation', icon: <FileText size={18} /> },
        { id: 'user-guide', label: 'User Guide', icon: <Info size={18} /> },
        { id: 'faq', label: 'FAQ', icon: <HelpCircle size={18} /> }
      ]
    },
    {
      title: 'Platform Information',
      items: [
        { id: 'fee-structure', label: 'Fee Structure', icon: <Coins size={18} /> },
        { id: 'legal-disclaimer', label: 'Legal Disclaimer', icon: <Gavel size={18} /> },
        { id: 'privacy-policy', label: 'Privacy Policy', icon: <Shield size={18} /> }
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'contact', label: 'Contact', icon: <MessageCircle size={18} /> }
      ]
    }
  ];

  // Change active section
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  // Render the active content section
  const renderActiveContent = () => {
    switch (activeSection) {
      case 'main-doc':
        return <DocsMainContent />;
      case 'user-guide':
        return <DocsUserGuide />;
      case 'faq':
        return <DocsFaq />;
      case 'fee-structure':
        return <DocsLegal showOnlyFees={true} />;
      case 'legal-disclaimer':
        return <DocsLegal />;
      case 'privacy-policy':
        return <DocsPrivacy />;
      case 'contact':
        return (
          <div className="content-section">
            <div className="content-header">
              <h1>Contact Us</h1>
            </div>
            <div style={{
              backgroundColor: theme.bg.card,
              padding: '24px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`
            }}>
              <p style={{ marginBottom: '16px' }}>
                For support or questions, please reach out through our official channels:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '12px' }}>
                  <a href="https://discord.gg/udY4b8gD" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: theme.accent.primary, textDecoration: 'none' }}>
                    Discord Community
                  </a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <a href="https://github.com/desu777" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: theme.accent.primary, textDecoration: 'none' }}>
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return <DocsMainContent />;
    }
  };

  // Use the appropriate accent color based on theme mode
  const accentColor = darkMode ? theme.accent.primary : theme.accent.secondary;

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Tło z cząsteczkami */}
      {/* <ParticleBackground zIndex={0} /> */}
      
      {/* Main content */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
          padding: '12px 0',
          borderBottom: `1px solid ${theme.border}`
        }}>
          {sections.flatMap(section => 
            section.items.map(item => (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: activeSection === item.id 
                    ? (darkMode ? 'rgba(0, 210, 233, 0.1)' : 'rgba(255, 92, 170, 0.05)')
                    : 'transparent',
                  border: `1px solid ${activeSection === item.id ? accentColor : theme.border}`,
                  borderRadius: '6px',
                  color: activeSection === item.id ? accentColor : theme.text.primary,
                  fontSize: '14px',
                  fontWeight: activeSection === item.id ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ marginRight: '8px', opacity: 0.9 }}>{item.icon}</span>
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <ChevronRight size={14} style={{ marginLeft: '6px' }} />
                )}
              </button>
            ))
          )}
        </div>

        <div>
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
};

export default DocsPage; 