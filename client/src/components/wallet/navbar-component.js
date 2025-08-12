import React, { useState } from 'react';
import { useWallet } from './wallet-context';

const Navbar = () => {
  const { 
    wallet, 
    username, 
    connectWallet, 
    openWalletModal, 
    isConnecting,
    setUser
  } = useWallet();
  
  const [showLogin, setShowLogin] = useState(false);
  const [inputUsername, setInputUsername] = useState('');

  // Obsługa logowania i połączenia portfela
  const handleSignIn = () => {
    if (inputUsername.trim()) {
      setUser(inputUsername);
      setShowLogin(false);
      
      // Jeśli portfel nie jest podłączony, podłącz go od razu
      if (!wallet) {
        connectWallet();
      }
    }
  };

  return (
    <nav className="bg-gray-900 text-white py-4 px-6 flex justify-between items-center">
      <div className="flex-1 flex items-center">
        <img 
          src="/pfp.gif" 
          alt="lf0g Logo" 
          className="w-10 h-10 mr-2"
        />
        <a href="/" className="text-xl font-bold">lf0g.fun</a>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Wyświetlany username, jeśli jest dostępny */}
        {username && (
          <span className="text-sm">
            @{username}
          </span>
        )}
        
        {/* Przycisk logowania, jeśli nie jesteśmy zalogowani */}
        {!username && !showLogin && (
          <button 
            className="bg-transparent border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition"
            onClick={() => setShowLogin(true)}
          >
            Sign In
          </button>
        )}
        
        {/* Formularz logowania */}
        {showLogin && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              className="bg-gray-800 px-3 py-2 rounded text-white outline-none"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={handleSignIn}
            >
              Login
            </button>
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => setShowLogin(false)}
            >
              Cancel
            </button>
          </div>
        )}
        
        {/* Przycisk Wallet */}
        {wallet ? (
          <button
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition"
            onClick={openWalletModal}
          >
            <img 
              src="/pfp.png" 
              alt="Wallet" 
              className="rounded-full w-5 h-5"
            />
            <span>{wallet.shortAddress}</span>
          </button>
        ) : (
          <button
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ${
              isConnecting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
