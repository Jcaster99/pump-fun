/**
 * Leaderboard Service API - COMMENTED OUT
 */

/*
import { LEADERBOARD_URL } from '../utils/apiConfig';

export const fetchLeaderboardData = async (timeframe = 'weekly') => {
  try {
    const response = await fetch(`${LEADERBOARD_URL}/leaderboard?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    // Return empty arrays as fallback
    return {
      tokens: [],
      pools: [],
      users: []
    };
  }
};

export default {
  fetchLeaderboardData
};
*/ 