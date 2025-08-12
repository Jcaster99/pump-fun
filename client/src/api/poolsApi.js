import { fetchWithAuth } from '../utils/authService';
import { API_URL } from '../utils/apiConfig';
import logger from '../utils/logger';

// Simple cache system to prevent too many requests
const cache = {
  data: {},
  timestamps: {},
  maxAge: 0, // Set to 0 to disable caching
  
  // Check if cache has valid data for a given key
  has(key) {
    // Always return false to bypass caching
    return false;
  },
  
  // Get cached data for a key
  get(key) {
    return this.data[key];
  },
  
  // Set cache data with current timestamp
  set(key, data) {
    // Don't store anything in cache
    return;
  },
  
  // Clear all cache
  clear() {
    this.data = {};
    this.timestamps = {};
  }
};

/**
 * Fetch all pools with optional parameters
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of pools to fetch
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.order - Order direction (ASC/DESC)
 * @param {number} options.page - Page number for pagination
 * @returns {Promise<Array>} - Array of pools
 */
export const fetchPools = async (options = {}) => {
  const { limit = 50, orderBy = 'market_cap', order = 'DESC', page = 1 } = options;
  const cacheKey = `pools_${limit}_${orderBy}_${order}_${page}`;
  
  try {
    // Removed cache check
    logger.debug('[Cache disabled] Fetching fresh data for', cacheKey);
    const url = `${API_URL}/pools?limit=${limit}&orderBy=${orderBy}&order=${order}&page=${page}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pools');
    }
    
    const data = await response.json();
    
    // Removed cache set
    
    return data;
  } catch (error) {
    logger.error('Error fetching pools:', error);
    throw error;
  }
};

/**
 * Fetch newest pools
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of pools to fetch
 * @param {string} options.sortBy - Field to sort by (created_at, market_cap, etc.)
 * @param {string} options.order - Order direction (ASC/DESC)
 * @param {number} options.page - Page number for pagination
 * @returns {Promise<Object>} - Object containing array of pools and pagination data
 */
export const fetchNewestPools = async (options = {}) => {
  const { limit = 50, sortBy = 'created_at', order = 'DESC', page = 1 } = options;
  const cacheKey = `newest_pools_${limit}_${sortBy}_${order}_${page}`;
  
  try {
    // Cache disabled
    logger.debug('[Cache disabled] Fetching fresh data for', cacheKey);
    const url = `${API_URL}/pools?limit=${limit}&orderBy=${sortBy}&order=${order}&page=${page}`;
    
    logger.debug(`[poolsApi] Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch newest pools');
    }
    
    const data = await response.json();
    logger.debug(`[poolsApi] API Response:`, data);
    
    // Upewniamy się, że zwracamy dane w oczekiwanym formacie
    if (data && data.success === true) {
      // Format odpowiedzi: { success: true, data: [...], pagination: {...} }
      return data;
    } else if (Array.isArray(data)) {
      // Starszy format odpowiedzi: tylko tablica poolów
      // Konwertujemy do nowego formatu dla kompatybilności
      logger.warn(`[poolsApi] Received legacy array format, converting to new format`);
      return {
        success: true,
        data: data,
        pagination: {
          current_page: page,
          last_page: Math.ceil(data.length / limit),
          total: data.length,
          per_page: limit
        }
      };
    } else {
      // Nieznany format
      logger.error(`[poolsApi] Unexpected response format:`, data);
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    logger.error('Error fetching newest pools:', error);
    throw error;
  }
};

/**
 * Fetch trending pools
 * @param {number} limit - Number of trending pools to fetch
 * @returns {Promise<Array>} - Array of trending pools
 */
export const fetchTrendingPools = async (limit = 5) => {
  const cacheKey = `trending_pools_${limit}`;
  
  try {
    // Cache disabled
    logger.debug('[Cache disabled] Fetching fresh data for', cacheKey);
    const url = `${API_URL}/pools/trending?limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending pools');
    }
    
    const data = await response.json();
    
    return data; // Return the full response object for consistency
  } catch (error) {
    logger.error('Error fetching trending pools:', error);
    throw error;
  }
};

/**
 * Fetch top pools by Gravity Score
 * @param {number} limit - Number of pools to fetch
 * @returns {Promise<Object>} - Object containing array of top gravity pools
 */
export const fetchTopGravityPools = async (limit = 10) => {
  const cacheKey = `gravity_pools_${limit}`;
  
  try {
    // Cache disabled
    logger.debug('[Cache disabled] Fetching top gravity pools, limit:', limit);
    const url = `${API_URL}/pools/top-gravity?limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch top gravity pools');
    }
    
    const data = await response.json();
    
    return data; // Return the full response object for consistency
  } catch (error) {
    logger.error('Error fetching top gravity pools:', error);
    throw error;
  }
};

/**
 * Search pools by name or symbol
 * @param {string} term - Search term
 * @param {number} limit - Number of results to return
 * @param {boolean} symbolSearch - Whether to search only by symbol (used for short searches)
 * @returns {Promise<Object>} - Object containing search results
 */
export const searchPools = async (term, limit = 10, symbolSearch = false) => {
  const cacheKey = `search_${term}_${limit}_${symbolSearch}`;
  
  try {
    // Cache disabled
    logger.debug('[Cache disabled] Searching pools for', term);
    const url = `${API_URL}/pools/search?term=${encodeURIComponent(term)}&limit=${limit}${symbolSearch ? '&symbolSearch=true' : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to search pools');
    }
    
    const data = await response.json();
    
    // Handle different API response formats
    if (data.success && data.data) {
      // Convert to expected format for the UI
      return { pools: data.data };
    }
    
    return data; // Return full response object for consistency
  } catch (error) {
    logger.error('Error searching pools:', error);
    throw error;
  }
};

/**
 * Fetch a single pool by contract address
 * @param {string} address - Contract address
 * @returns {Promise<Object>} - Pool data
 */
export const fetchPoolByAddress = async (address) => {
  const cacheKey = `pool_${address}`;
  
  try {
    // Cache disabled
    logger.debug('[Cache disabled] Fetching pool data for', address);
    const url = `${API_URL}/pools/${address}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pool');
    }
    
    const data = await response.json();
    
    return data; // Return full response object for consistency
  } catch (error) {
    logger.error('Error fetching pool by address:', error);
    throw error;
  }
};

/**
 * Create a new pool
 * @param {FormData} formData - Pool data form
 * @returns {Promise<Object>} - Created pool
 */
export const createPool = async (formData) => {
  try {
    // No caching for POST requests
    const response = await fetchWithAuth(`${API_URL}/pools`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create pool');
    }
    
    const data = await response.json();
    
    // Clear cache after successful creation to ensure fresh data
    cache.clear();
    
    return data;
  } catch (error) {
    logger.error('Error creating pool:', error);
    throw error;
  }
};

/**
 * Fetch pools created by a specific address
 * @param {string} address - Creator's address
 * @returns {Promise<Array>} - Array of pools
 */
export const fetchUserPools = async (address) => {
  const cacheKey = `user_pools_${address}`;
  
  try {
    // Check cache first
    if (cache.has(cacheKey)) {
      logger.debug('[Cache hit] Using cached user pools for', address);
      return cache.get(cacheKey);
    }
    
    logger.debug('[Cache miss] Fetching user pools for', address);
    
    const response = await fetch(`${API_URL}/pools/creator/${address}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user pools');
    }
    
    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    logger.error('Error fetching user pools:', error);
    throw error;
  }
};

/**
 * Fetch total 24h volume across all pools
 * @returns {Promise<number>} - Total 24h volume
 */
export const fetchTotalVolume = async () => {
  try {
    const url = `${API_URL}/pools?limit=9999&getTotalVolumeOnly=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch total volume');
    }
    
    const data = await response.json();
    
    return data.totalVolume || 0;
  } catch (error) {
    logger.error('Error fetching total volume:', error);
    return 0;
  }
};

// Function to manually clear the cache
export const clearCache = () => {
  cache.clear();
  logger.debug('Cache cleared');
};

export default {
  fetchPools,
  fetchNewestPools,
  fetchTrendingPools,
  fetchTopGravityPools,
  searchPools,
  fetchPoolByAddress,
  createPool,
  fetchUserPools,
  fetchTotalVolume,
  clearCache
};