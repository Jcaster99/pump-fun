// Index file for PoolActionPanel
import PoolActionPanelView from './PoolActionPanel.View';
import PoolActionPanelLogic from './PoolActionPanel.Logic';

// The main component that combines the logic and view
const PoolActionPanel = ({ pool, theme, darkMode, hidePriceHeader }) => {
  // Pass all props to the logic component which will handle state and functions
  // The logic component will then render the view component with all necessary props
  return <PoolActionPanelLogic 
    pool={pool} 
    theme={theme} 
    darkMode={darkMode} 
    hidePriceHeader={hidePriceHeader} 
  />;
};

export default PoolActionPanel; 