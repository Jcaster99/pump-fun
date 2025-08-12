import { useState } from 'react';
import { ethers } from 'ethers';
import { createToken } from '../api/lf0gFactoryApi';
import logger from '../utils/logger';

const useCreateToken = (wallet, connectWallet, navigate, username) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter_url: '',
    website_url: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({
    name: '',
    symbol: '',
    twitter_url: '',
    website_url: ''
  });
  
  // Transaction progress state
  const [transactionStep, setTransactionStep] = useState(null); // 'sending', 'confirming', 'creating'
  
  // Contract addresses state
  const [tokenAddress, setTokenAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);

  // Form visibility state
  const [formVisible, setFormVisible] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image change
  const handleImageChange = async (e, handleImageValidation) => {
    // If no files, clear the image
    if (!e.target.files || e.target.files.length === 0) {
      setImage(null);
      setImagePreview(null);
      return;
    }
    
    const file = e.target.files[0];
    if (file) {
      // Check file size - max 500KB
      if (file.size > 500 * 1024) {
        setFormErrors(prev => ({ 
          ...prev, 
          image: 'Image file is too large. Maximum size is 500KB.'
        }));
        return;
      }
      
      await handleImageValidation(file, setImage, setImagePreview, setFormErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Token name is required';
    }
    
    if (!formData.symbol.trim()) {
      errors.symbol = 'Symbol is required';
    }
    
    // Validate X username format if provided
    if (formData.twitter_url) {
      // If the user already entered a full URL, extract just the username
      if (formData.twitter_url.includes('x.com/') || formData.twitter_url.includes('twitter.com/')) {
        // Do nothing, we'll handle this properly when submitting
      } else if (formData.twitter_url.startsWith('@')) {
        // Remove @ if user included it
        formData.twitter_url = formData.twitter_url.substring(1);
      } else if (!/^[A-Za-z0-9_]{1,15}$/.test(formData.twitter_url)) {
        // X usernames are limited to 15 characters, alphanumeric and underscores
        errors.twitter_url = 'Please enter a valid X username (letters, numbers, and underscores only)';
      }
    }
    
    // Validate website URL if provided
    if (formData.website_url) {
      try {
        const url = new URL(formData.website_url);
        // Check if it has a proper domain extension
        if (!url.hostname.includes('.')) {
          errors.website_url = 'Please enter a valid domain with extension (e.g., .com, .xyz)';
        }
      } catch (e) {
        // If it fails to parse as URL, check if it's missing the protocol
        if (formData.website_url.includes('.') && !formData.website_url.startsWith('http')) {
          // User might have entered something like "example.com" without https://
          // We'll handle this when submitting, but it's valid
        } else {
          errors.website_url = 'Please enter a valid URL (e.g., https://example.com)';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to validate URLs
  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e, TREASURY_ADDRESS, LISTING_FEE) => {
    e.preventDefault();
    
    if (loading) return;
    
    if (!validateForm()) {
      return;
    }
    
    // Process the form data
    let processedData = { ...formData };
    
    // Format X username URL properly
    if (processedData.twitter_url) {
      if (processedData.twitter_url.includes('twitter.com/') || processedData.twitter_url.includes('x.com/')) {
        // Extract username from existing URL
        let parts = processedData.twitter_url.split('/');
        let username = parts[parts.length - 1];
        processedData.twitter_url = `https://x.com/${username}`;
      } else if (processedData.twitter_url.startsWith('@')) {
        // Remove @ if user included it
        processedData.twitter_url = `https://x.com/${processedData.twitter_url.substring(1)}`;
      } else {
        // Add the proper prefix
        processedData.twitter_url = `https://x.com/${processedData.twitter_url}`;
      }
    }
    
    // Format website URL properly
    if (processedData.website_url && !processedData.website_url.startsWith('http')) {
      processedData.website_url = `https://${processedData.website_url}`;
    }
    
    // Verify wallet is connected
    if (!wallet) {
      connectWallet();
      setError('You must connect your wallet to create a token');
      return;
    }

    // Submit the form
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First send the listing fee
      if (!wallet.signer) {
        throw new Error("Wallet not connected or signer not available");
      }
      
      const feeAmount = ethers.utils.parseEther(LISTING_FEE); // Convert to wei format
      
      // Check if user has enough balance
      const balance = await wallet.publicClient.getBalance({
        address: wallet.address
      });
      if (ethers.BigNumber.from(balance.toString()).lt(feeAmount)) {
        throw new Error(`Insufficient balance. You need at least ${LISTING_FEE} MON to list a pool.`);
      }
      
      // Show user that fee is being sent
      setSuccess(`Sending listing fee of ${LISTING_FEE} MON to treasury...`);
      setTransactionStep('sending');
      
      // Send the transaction with Wagmi v2 syntax
      let transactionHash;
      try {
        transactionHash = await wallet.signer.sendTransaction({
          to: TREASURY_ADDRESS,
          value: feeAmount,
        });
        
        logger.log('Transaction sent:', transactionHash);
      } catch (txError) {
        logger.error('Error sending transaction:', txError);
        setTransactionStep(null);
        throw new Error(`Transaction failed: ${txError.message}`);
      }
      
      // Wait for the transaction to be confirmed
      setSuccess('Waiting for fee transaction to be confirmed...');
      setTransactionStep('confirming');
      
      try {
        const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash: transactionHash });
        
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
        
        logger.log('Transaction confirmed:', receipt);
      } catch (error) {
        setTransactionStep(null);
        throw new Error(`Transaction confirmation failed: ${error.message}`);
      }
      
      // Create token using lf0gFactory API
      setSuccess('Creating token via lf0gFactory...');
      setTransactionStep('creating');
      
      const tokenData = {
        name: processedData.name,
        symbol: processedData.symbol,
        description: processedData.description || '',
        creatorAddress: wallet.address
      };
      
      const response = await createToken(tokenData);
      
      if (response.success) {
        setContractAddress(response.data.tokenAddress);
        setSuccess(`Token successfully created at address: ${response.data.tokenAddress}`);
        
        // Teraz tworzymy pulę w bazie danych używając otrzymanych danych
        try {
          // Wartości stałe z BondingCurveToken.sol
          const VIRTUAL_TOKEN_RESERVES = 1888888888 * 1e18;
          const VIRTUAL_USDT_RESERVES = 100000 * 1e18;
          
          // Obliczamy cenę na podstawie rezerw
          const price = VIRTUAL_USDT_RESERVES / VIRTUAL_TOKEN_RESERVES;
          
          // Obliczamy k_constant
          const k_constant = VIRTUAL_TOKEN_RESERVES * VIRTUAL_USDT_RESERVES;
          
          // Wartości domyślne
          const totalSupply = 1888888888;
          const totalSupplyUsdt = 100000;
          
          // Liquidity to total_supply * total_supply_usdt z limitem
          let liquidity = totalSupply * totalSupplyUsdt;
          // Ograniczamy wartość, żeby uniknąć zbyt dużych liczb
          if (liquidity > 1e12) {
            liquidity = 1e12;
          }
          
          // Market cap startowo ZAWSZE 0
          const marketCap = 0;
          
          // Holders zawsze startuje od 1
          const holders = 1;
          
          // Rezerwa dla twórcy (5% całkowitej podaży)
          const creatorReserve = 0.05 * totalSupply;
          
          // Tworzymy FormData aby móc przesłać obraz (jeśli jest)
          const poolFormData = new FormData();
          
          // Dodajemy podstawowe dane do formularza
          poolFormData.append('name', processedData.name);
          poolFormData.append('symbol', processedData.symbol);
          poolFormData.append('token_address', response.data.tokenAddress);
          poolFormData.append('description', processedData.description || '');
          poolFormData.append('creator_address', wallet.address);
          poolFormData.append('creator_name', username || '');
          poolFormData.append('price', price.toString());
          poolFormData.append('market_cap', marketCap.toString());
          poolFormData.append('liquidity', liquidity.toString());
          poolFormData.append('holders', holders.toString());
          poolFormData.append('total_supply', totalSupply.toString());
          poolFormData.append('total_supply_usdt', totalSupplyUsdt.toString());
          poolFormData.append('virtual_reserve_token', VIRTUAL_TOKEN_RESERVES.toString());
          poolFormData.append('virtual_reserve_usdt', VIRTUAL_USDT_RESERVES.toString());
          poolFormData.append('k_constant', k_constant.toString());
          poolFormData.append('creator_reserve', creatorReserve.toString());
          
          // Opcjonalne dane
          if (processedData.twitter_url) {
            poolFormData.append('twitter_url', processedData.twitter_url);
          }
          
          if (processedData.website_url) {
            poolFormData.append('website_url', processedData.website_url);
          }
          
          // Dodajemy obraz do formularza (jeśli istnieje)
          if (image) {
            poolFormData.append('image', image);
          }
          
          // Importujemy funkcję createPool
          const { createPool } = await import('../api/poolsApi');
          
          // Tworzenie puli
          setSuccess('Creating pool in the database...');
          const poolResponse = await createPool(poolFormData);
          
          if (poolResponse.success) {
            setSuccess('Pool successfully created!');
            logger.log('Pool created successfully:', poolResponse.data);
            
            // Reset form
            setFormData({
              name: '',
              symbol: '',
              description: '',
              twitter_url: '',
              website_url: ''
            });
            setImage(null);
            setImagePreview(null);
            
            // Redirect to the newly created token details page after a short delay
            setTimeout(() => {
              navigate(`/pool/${response.data.tokenAddress}`);
            }, 1500);
          } else {
            throw new Error(poolResponse.error || 'Failed to create pool in database');
          }
        } catch (poolError) {
          logger.error('Error creating pool in database:', poolError);
          setError(`Token created, but failed to create pool: ${poolError.message}`);
          
          // Wciąż możemy przekierować do nowo utworzonego tokenu
          setTimeout(() => {
            navigate(`/pool/${response.data.tokenAddress}`);
          }, 3000);
        }
      } else {
        setError(response.error || 'Failed to create token');
      }
    } catch (err) {
      logger.error('Error in token creation process:', err);
      
      // Formatowanie przyjaznego komunikatu o błędzie
      let errorMessage = err.message;
      
      // Sprawdzanie konkretnych błędów
      if (errorMessage.includes('insufficient balance')) {
        errorMessage = `You don't have enough 0G in your wallet to pay the creation fee. Please add more funds and try again.`;
      } else if (errorMessage.includes('Signer had insufficient balance')) {
        errorMessage = `Insufficient funds in your wallet. Please add more 0G to your wallet and try again.`;
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by the user.';
      }
      
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setTransactionStep(null);
    }
  };

  // Funkcja do rozwijania formularza i przewijania do niego
  const showForm = () => {
    setFormVisible(true);
    // Krótkie opóźnienie, aby dać czas na renderowanie przed przewijaniem
    setTimeout(() => {
      document.getElementById('token-form').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
    }, 300);
  };

  return {
    formData,
    setFormData,
    image,
    setImage,
    imagePreview,
    setImagePreview,
    loading,
    error,
    setError,
    success,
    setSuccess,
    formErrors,
    setFormErrors,
    transactionStep,
    tokenAddress,
    contractAddress,
    formVisible,
    handleChange,
    handleImageChange,
    validateForm,
    handleSubmit,
    showForm
  };
};

export default useCreateToken; 