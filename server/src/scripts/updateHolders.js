const { updateAllHolderData } = require('../utils/updateHolders');
const logger = require('../utils/logger');

// Get pool ID from command line arguments if provided
const args = process.argv.slice(2);
const poolId = args.length > 0 ? parseInt(args[0]) : null;

logger.log(`Starting holder data update${poolId ? ` for pool ID ${poolId}` : ''}`);

(async () => {
  try {
    const result = await updateAllHolderData(poolId);
    
    if (result.success) {
      logger.log('Holder data update completed successfully');
      logger.log(`Total pools: ${result.results.total}`);
      logger.log(`Updated: ${result.results.updated}`);
      logger.log(`Failed: ${result.results.failed}`);
      
      if (result.results.failed > 0) {
        logger.log('Failed pools:');
        result.results.errors.forEach(error => {
          logger.log(`- Pool ID ${error.poolId} (${error.poolName}): ${error.error}`);
        });
      }
    } else {
      logger.error(`Update failed: ${result.error || result.message}`);
    }
  } catch (error) {
    logger.error('Error running holder data update:', error);
  }
  
  process.exit(0);
})(); 