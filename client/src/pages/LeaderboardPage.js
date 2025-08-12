/**
 * LeaderboardPage.js - COMMENTED OUT
 */

/*
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, useTheme } from '@mui/material';
import leaderboardService from '../api/leaderboardService';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import ErrorDisplay from '../components/common/ErrorDisplay';
import RefreshButton from '../components/common/RefreshButton';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [updateStatus, setUpdateStatus] = useState(null);
  const theme = useTheme();
  
  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get leaderboard data
      const data = await leaderboardService.getLeaderboard(100);
      setLeaderboardData(data.wallets || []);
      
      // Get update status
      const status = await leaderboardService.getUpdateStatus();
      setUpdateStatus(status);
    } catch (err) {
      console.error("Failed to fetch leaderboard data:", err);
      setError("Could not load leaderboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchLeaderboardData();
    
    // Poll for updates every 2 minutes
    const intervalId = setInterval(() => {
      fetchLeaderboardData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchLeaderboardData]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getUpdateTimeInfo = () => {
    if (!updateStatus || !updateStatus.last_update) {
      return "Update status unknown";
    }
    return `Last updated: ${formatDate(updateStatus.last_update)}`;
  };
  
  return (
    <Box
      sx={{
        padding: { xs: '20px', md: '40px' },
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          mb: 3
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3f51b5, #2196f3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          zer0_Leaderboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Typography 
            variant="caption"
            sx={{ 
              color: theme.palette.text.secondary,
              fontStyle: 'italic'
            }}
          >
            {getUpdateTimeInfo()}
          </Typography>
          <RefreshButton 
            onClick={fetchLeaderboardData} 
            loading={isLoading}
            size="small"
          />
        </Box>
      </Box>
      
      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              fontWeight: 'medium',
              minHeight: '48px'
            }
          }}
        >
          <Tab label="All Time" />
          <Tab label="This Month" />
          <Tab label="This Week" />
        </Tabs>
        
        {isLoading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: '60px 0'
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <ErrorDisplay 
            message={error} 
            onRetry={fetchLeaderboardData}
          />
        ) : (
          <>
            {tabValue === 0 && (
              <LeaderboardTable 
                data={leaderboardData}
                timeframe="all"
              />
            )}
            {tabValue === 1 && (
              <LeaderboardTable 
                data={leaderboardData.filter(wallet => {
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return new Date(wallet.first_interaction_date) >= oneMonthAgo;
                })}
                timeframe="month"
              />
            )}
            {tabValue === 2 && (
              <LeaderboardTable 
                data={leaderboardData.filter(wallet => {
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return new Date(wallet.first_interaction_date) >= oneWeekAgo;
                })}
                timeframe="week"
              />
            )}
          </>
        )}
      </Paper>
      
      <Typography 
        variant="body2"
        sx={{ 
          mt: 2,
          color: theme.palette.text.secondary,
          textAlign: 'center'
        }}
      >
        The leaderboard tracks user activity on the zer0 blockchain. Top users may get exclusive benefits in the future.
      </Typography>
    </Box>
  );
};

export default LeaderboardPage;
*/ 