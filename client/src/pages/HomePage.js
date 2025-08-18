import React, { useEffect, useState } from 'react';
import PoolsTicker from '../components/pools/PoolsTicker';
import TrendingPools from '../components/pools/TrendingPools';

const HomePage = () => {
  const [, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        zIndex: 5,
        position: 'relative',
      }}>
        <PoolsTicker />
        <TrendingPools />
      </div>
    </div>
  );
};

export default HomePage; 