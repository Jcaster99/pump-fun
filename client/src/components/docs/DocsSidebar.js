import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Code, ChevronRight, X } from 'lucide-react';

const DocsSidebar = ({ 
  sections, 
  activeSection, 
  onSectionChange, 
  isOpen, 
  isMobile,
  toggleSidebar
}) => {
  const { theme, darkMode } = useTheme();

  return (
    <aside 
      style={{
        backgroundColor: theme.bg.card,
        width: '280px',
        height: isMobile ? '100vh' : 'calc(100vh - 60px)',
        position: isMobile ? 'fixed' : 'sticky',
        top: isMobile ? 0 : '60px',
        left: 0,
        borderRight: `1px solid ${theme.border}`,
        zIndex: 20,
        overflowY: 'auto',
        padding: '20px 0',
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: theme.text.secondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <X size={20} />
        </button>
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 20px',
        marginBottom: '24px'
      }}>
        <Code size={24} style={{ color: theme.accent.primary, marginRight: '12px' }} />
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          background: `linear-gradient(90deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          lf0g.fun Docs
        </h2>
      </div>

      {sections.map((section, index) => (
        <div key={index} style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: theme.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '0 20px',
            marginBottom: '8px'
          }}>
            {section.title}
          </h3>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 20px',
                    backgroundColor: activeSection === item.id 
                      ? (darkMode ? 'rgba(0, 210, 233, 0.1)' : 'rgba(0, 210, 233, 0.05)')
                      : 'transparent',
                    border: 'none',
                    borderLeft: activeSection === item.id 
                      ? `3px solid ${theme.accent.primary}` 
                      : '3px solid transparent',
                    color: activeSection === item.id 
                      ? theme.accent.primary 
                      : theme.text.primary,
                    fontWeight: activeSection === item.id ? '500' : '400',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ marginRight: '12px', opacity: 0.9 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
};

export default DocsSidebar; 