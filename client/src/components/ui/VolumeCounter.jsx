import { BarChart2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTotalVolume } from "../../api/poolsApi";
import { useTheme } from "../../context/ThemeContext";

export const VolumeCounter = () => {
  const [totalVolume, setTotalVolume] = useState(0);
  const { theme, darkMode } = useTheme();
  useEffect(() => {
    const getStats = async () => {
      try {
        const volume = await fetchTotalVolume();
        setTotalVolume(volume);
      } catch (error) {
        console.error('Error fetching total volume:', error);
      }
    };

    getStats();
  }, []);

  // Format volume for display
  const formatVolume = (volume) => {
    if (!volume) return '$0';
    
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };
  return (
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
        <span style={{ fontSize: '14px', color: theme.text.tertiary }}>24h Volume: </span>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          color: theme.accent.secondary,
          marginLeft: '5px',
        }}>
          {formatVolume(totalVolume)}
        </span>
      </div>
    </div>
  )
}