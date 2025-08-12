/**
 * Utility script to check database schema
 * Run with: node checkSchema.js
 */

const { getDbConnection } = require('../db/init');
const logger = require('../utils/logger');

const checkDatabaseSchema = () => {
  const db = getDbConnection();
  
  try {
    // List all tables
    logger.log('=== DATABASE TABLES ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables.forEach(table => logger.log(table.name));
    
    // Check transactions table schema
    logger.log('\n=== TRANSACTIONS TABLE SCHEMA ===');
    const transactionsSchema = db.prepare("PRAGMA table_info(transactions)").all();
    console.table(transactionsSchema);
    
    // Check pools table schema
    logger.log('\n=== POOLS TABLE SCHEMA ===');
    const poolsSchema = db.prepare("PRAGMA table_info(pools)").all();
    console.table(poolsSchema);
    
  } catch (error) {
    logger.error('Error checking schema:', error);
  } finally {
    db.close();
  }
};

// Run the function
checkDatabaseSchema(); 