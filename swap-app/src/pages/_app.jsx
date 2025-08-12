import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../context/ThemeContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #2d2d42',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#0aa674',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e53e3e',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default MyApp; 