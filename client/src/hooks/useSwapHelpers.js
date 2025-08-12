import { useState, useCallback } from 'react';

/**
 * Hook providing helper functions for swap calculations and formatting
 */
export const useSwapHelpers = () => {
  /**
   * Format a decimal number with specified precision
   * @param {number|string} value - Value to format
   * @param {number} precision - Number of decimal places
   * @returns {string} - Formatted number
   */
  const formatDecimal = useCallback((value, precision = 6) => {
    if (!value && value !== 0) return '0';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (numValue === 0) return '0';
    
    // Handle very small numbers
    if (Math.abs(numValue) < Math.pow(10, -precision)) {
      return numValue.toExponential(precision);
    }
    
    // Regular formatting
    return numValue.toFixed(precision);
  }, []);
  
  /**
   * Calculate minimum or maximum amount with slippage
   * @param {number|string} amount - Original amount
   * @param {number} slippagePercent - Slippage percentage (e.g. 0.5 for 0.5%)
   * @param {boolean} isMax - If true, calculate maximum (for buy), if false, calculate minimum (for sell)
   * @returns {string} - Amount adjusted for slippage
   */
  const calculateSlippage = useCallback((amount, slippagePercent, isMax = false) => {
    if (!amount || isNaN(parseFloat(amount))) return '0';
    
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    const slippageFactor = slippagePercent / 100;
    
    if (isMax) {
      // Maximum amount (for max input calculation)
      const maxAmount = value * (1 + slippageFactor);
      return maxAmount.toString();
    } else {
      // Minimum amount (for min output calculation)
      const minAmount = value * (1 - slippageFactor);
      return minAmount.toString();
    }
  }, []);
  
  /**
   * Format price for display in UI
   * @param {number|string} price - Price value
   * @returns {string} - Formatted price string with $ sign
   */
  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return '$0.00';
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (numPrice >= 1) {
      return `$${numPrice.toFixed(2)}`;
    } else if (numPrice >= 0.01) {
      return `$${numPrice.toFixed(4)}`;
    } else if (numPrice === 0) {
      return '$0.00';
    }
    
    // Handle very small numbers (scientific notation)
    const priceStr = numPrice.toString();
    if (priceStr.includes('e-')) {
      const parts = priceStr.split('e-');
      const base = parseFloat(parts[0]);
      const exponent = parseInt(parts[1]);
      
      // Create string with the right number of leading zeros
      let result = '$0.';
      
      // Always display in decimal format for readability
      for (let i = 0; i < exponent - 1; i++) {
        result += '0';
      }
      
      // Add significant digits from the base (removing decimal point)
      const baseDigits = base.toString().replace('.', '').substring(0, 8);
      result += baseDigits;
      return result;
    }
    
    // Default formatting for small numbers - always show 8 decimals for very small values
    return `$${numPrice.toFixed(8)}`;
  }, []);
  
  /**
   * Calculate price impact percentage
   * @param {number} inputAmount - Input amount
   * @param {number} outputAmount - Output amount 
   * @param {number} spotPrice - Current spot price
   * @returns {number} - Price impact as percentage
   */
  const calculatePriceImpact = useCallback((inputAmount, outputAmount, spotPrice) => {
    if (!inputAmount || !outputAmount || !spotPrice) return 0;
    
    // For buy: input is USDT, output is tokens
    // Effective price = inputAmount / outputAmount
    // For sell: input is tokens, output is USDT
    // Effective price = outputAmount / inputAmount
    
    // Assuming inputAmount and spotPrice are in the same units
    const effectivePrice = inputAmount / outputAmount;
    const priceImpact = Math.abs((effectivePrice - spotPrice) / spotPrice) * 100;
    
    return Math.min(priceImpact, 100); // Cap at 100%
  }, []);
  
  /**
   * Format percentage for display
   * @param {number} percent - Percentage value
   * @returns {string} - Formatted percentage string
   */
  const formatPercent = useCallback((percent) => {
    if (!percent && percent !== 0) return '0.00%';
    
    const value = parseFloat(percent);
    
    if (value < 0.01 && value > 0) {
      return '<0.01%';
    }
    
    return `${value.toFixed(2)}%`;
  }, []);
  
  return {
    formatDecimal,
    calculateSlippage,
    formatPrice,
    calculatePriceImpact,
    formatPercent
  };
};
