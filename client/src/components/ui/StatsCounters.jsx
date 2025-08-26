import { useEffect, useState } from "react";
import { fetchPools } from '../../api/poolsApi';
import { useTheme } from "../../context/ThemeContext";

export const StatsCounters = () => {
  const { theme } = useTheme();
  const [totalPools, setTotalPools] = useState(0);
  useEffect(() => {
    const getStats = async () => {
      try {
        const response = await fetchPools({ limit: 1 });
        if (response && response.pagination && response.pagination.total) {
          setTotalPools(response.pagination.total);
        }
      } catch (error) {
        console.error('Error fetching total pools:', error);
      }
    };

    getStats();
  }, []);
  return (
    <div style={{
      gap: '12px',
      display: 'flex',
      flexWrap: 'wrap',
      margin: '16px auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: theme.bg.card,
        borderRadius: '1000px',
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', color: theme.text.tertiary }}>Total Tokens Created: </span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            color: theme.accent.secondary,
            marginLeft: '5px',
          }}>
            {totalPools.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}