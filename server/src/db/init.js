// SPDX-License-Identifier: MIT
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../../data.sqlite');

// Create database connection
const createConnection = () => {
  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return new Database(dbPath, { verbose: console.log });
};

// Run database migrations
const runMigrations = (db) => {
  console.log('Running database migrations...');
  
  // Check and add reserve_token column
  try {
    // First try to query the table info to see if the column exists
    const tableInfo = db.prepare("PRAGMA table_info(pools)").all();
    const columnNames = tableInfo.map(info => info.name);
    
    // Add columns if they don't exist
    if (!columnNames.includes('reserve_token')) {
      console.log('Adding reserve_token column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN reserve_token REAL DEFAULT 0');
    }
    
    // Add liquidity_pair_address column if it doesn't exist
    if (!columnNames.includes('liquidity_pair_address')) {
      console.log('Adding liquidity_pair_address column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN liquidity_pair_address TEXT(42) DEFAULT NULL');
    }
    
    // Handle the total_supply_tokenAMM column (previously total_supply_price)
    if (!columnNames.includes('total_supply_tokenAMM')) {
      if (columnNames.includes('total_supply_price')) {
        // Rename existing column
        console.log('Renaming total_supply_price column to total_supply_tokenAMM...');
        db.exec('ALTER TABLE pools RENAME COLUMN total_supply_price TO total_supply_tokenAMM');
      } else {
        // Create new column
        console.log('Adding total_supply_tokenAMM column to pools table...');
        db.exec('ALTER TABLE pools ADD COLUMN total_supply_tokenAMM REAL DEFAULT 0');
        
        // Initialize with same value as total_supply
        console.log('Initializing total_supply_tokenAMM with total_supply values...');
        db.exec('UPDATE pools SET total_supply_tokenAMM = total_supply');
      }
    }
    
    // Handle the total_supply_usdtAMM column (previously total_supply_usdt)
    if (!columnNames.includes('total_supply_usdtAMM')) {
      if (columnNames.includes('total_supply_usdt')) {
        // Rename existing column
        console.log('Renaming total_supply_usdt column to total_supply_usdtAMM...');
        db.exec('ALTER TABLE pools RENAME COLUMN total_supply_usdt TO total_supply_usdtAMM');
      } else {
        // Create new column
        console.log('Adding total_supply_usdtAMM column to pools table...');
        db.exec('ALTER TABLE pools ADD COLUMN total_supply_usdtAMM REAL DEFAULT 0');
        
        // Initialize with default value
        console.log('Initializing total_supply_usdtAMM with default value...');
        db.exec('UPDATE pools SET total_supply_usdtAMM = 100000');
      }
    }
    
    if (!columnNames.includes('price_realtime')) {
      console.log('Adding price_realtime column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN price_realtime REAL DEFAULT 0');
      
      // Initialize with same value as price
      console.log('Initializing price_realtime with price values...');
      db.exec('UPDATE pools SET price_realtime = price');
    }
    
    if (!columnNames.includes('reserve_usdt')) {
      console.log('Adding reserve_usdt column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN reserve_usdt REAL DEFAULT 0');
    }
    
    if (!columnNames.includes('twitter_url')) {
      console.log('Adding twitter_url column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN twitter_url TEXT');
    }
    
    if (!columnNames.includes('website_url')) {
      console.log('Adding website_url column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN website_url TEXT');
    }
    
    if (!columnNames.includes('gravity_score')) {
      console.log('Adding gravity_score column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN gravity_score INTEGER DEFAULT 0');
    }
    
    if (!columnNames.includes('zero_dex_rank')) {
      console.log('Adding zero_dex_rank column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN zero_dex_rank INTEGER DEFAULT NULL');
    }
    
    // Add new AMM-related columns
    if (!columnNames.includes('virtual_reserve_token')) {
      console.log('Adding virtual_reserve_token column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN virtual_reserve_token REAL DEFAULT 1888888888000000000000000000');
    }
    
    if (!columnNames.includes('virtual_reserve_usdt')) {
      console.log('Adding virtual_reserve_usdt column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN virtual_reserve_usdt REAL DEFAULT 100000000000000000000000');
    }
    
    if (!columnNames.includes('k_constant')) {
      console.log('Adding k_constant column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN k_constant TEXT DEFAULT NULL');
    }
    
    if (!columnNames.includes('bonding_curve_type')) {
      console.log('Adding bonding_curve_type column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN bonding_curve_type TEXT DEFAULT "constant_product"');
    }
    
    if (!columnNames.includes('curve_factor')) {
      console.log('Adding curve_factor column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN curve_factor TEXT DEFAULT "1e15"');
    }
    
    if (!columnNames.includes('creator_reserve')) {
      console.log('Adding creator_reserve column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN creator_reserve REAL DEFAULT 283333333200000000000000000');
    }
    
    if (!columnNames.includes('creator_unlocked_reserve')) {
      console.log('Adding creator_unlocked_reserve column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN creator_unlocked_reserve REAL DEFAULT 0');
    }
    
    if (!columnNames.includes('trade_fee_percent')) {
      console.log('Adding trade_fee_percent column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN trade_fee_percent REAL DEFAULT 0.1');
    }
    
    // Dodajemy nowe pola bonding_curve_percentage i graduated
    if (!columnNames.includes('bonding_curve_percentage')) {
      console.log('Adding bonding_curve_percentage column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN bonding_curve_percentage REAL DEFAULT 0.0');
    }
    
    if (!columnNames.includes('graduated')) {
      console.log('Adding graduated column to pools table...');
      db.exec('ALTER TABLE pools ADD COLUMN graduated TEXT DEFAULT "no"');
    }
    
    // Update k_constant for existing pools
    if (columnNames.includes('virtual_reserve_token') && columnNames.includes('virtual_reserve_usdt') && !columnNames.includes('k_constant')) {
      console.log('Updating k_constant for existing pools...');
      const pools = db.prepare('SELECT id, virtual_reserve_token, virtual_reserve_usdt FROM pools').all();
      const updateStmt = db.prepare('UPDATE pools SET k_constant = ? WHERE id = ?');
      
      for (const pool of pools) {
        const k = pool.virtual_reserve_token * pool.virtual_reserve_usdt;
        updateStmt.run(k.toString(), pool.id);
      }
    }
    
    // Check for transactions table columns
    const txTableInfo = db.prepare("PRAGMA table_info(transactions)").all();
    const txColumnNames = txTableInfo.map(info => info.name);
    
    // Add new transaction columns if needed
    if (!txColumnNames.includes('token_amount')) {
      console.log('Adding token_amount column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN token_amount REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('usdt_amount')) {
      console.log('Adding usdt_amount column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN usdt_amount REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('fee_amount')) {
      console.log('Adding fee_amount column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN fee_amount REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('reserve_token_before')) {
      console.log('Adding reserve_token_before column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN reserve_token_before REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('reserve_usdt_before')) {
      console.log('Adding reserve_usdt_before column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN reserve_usdt_before REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('reserve_token_after')) {
      console.log('Adding reserve_token_after column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN reserve_token_after REAL DEFAULT NULL');
    }
    
    if (!txColumnNames.includes('reserve_usdt_after')) {
      console.log('Adding reserve_usdt_after column to transactions table...');
      db.exec('ALTER TABLE transactions ADD COLUMN reserve_usdt_after REAL DEFAULT NULL');
    }
    
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Error during database migration:', error);
  }
};

// Initialize database with schema
const initializeDatabase = () => {
  const db = createConnection();
  
  // Create pools table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      token_address TEXT(42),
      image_url TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      price_realtime REAL DEFAULT 0,
      market_cap REAL DEFAULT 0,
      liquidity REAL DEFAULT 0,
      volume_24h REAL DEFAULT 0,
      holders INTEGER DEFAULT 0,
      change_24h REAL DEFAULT 0,
      creator_address TEXT(42),
      creator_name TEXT,
      replies INTEGER DEFAULT 0,
      total_supply REAL DEFAULT 0,
      total_supply_tokenAMM REAL DEFAULT 0,
      total_supply_usdtAMM REAL DEFAULT 0,
      token_sold REAL DEFAULT 0,
      usdt_in_bonding_curve REAL DEFAULT 0,
      virtual_reserve_token REAL DEFAULT 1888888888000000000000000000,
      virtual_reserve_usdt REAL DEFAULT 100000000000000000000000,
      k_constant TEXT DEFAULT NULL,
      bonding_curve_type TEXT DEFAULT 'constant_product',
      curve_factor TEXT DEFAULT '1e15',
      creator_reserve REAL DEFAULT 283333333200000000000000000,
      creator_unlocked_reserve REAL DEFAULT 0,
      trade_fee_percent REAL DEFAULT 0.1,
      gravity_score INTEGER DEFAULT 0,
      zero_dex_rank INTEGER DEFAULT NULL,
      twitter_url TEXT,
      website_url TEXT,
      bonding_curve_percentage REAL DEFAULT 0.0,
      graduated TEXT DEFAULT 'no',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      token_amount REAL DEFAULT NULL,
      usdt_amount REAL DEFAULT NULL,
      fee_amount REAL DEFAULT NULL,
      type TEXT NOT NULL,
      tx_hash TEXT UNIQUE NOT NULL,
      wallet_address TEXT(42) NOT NULL,
      reserve_token_before REAL DEFAULT NULL,
      reserve_usdt_before REAL DEFAULT NULL,
      reserve_token_after REAL DEFAULT NULL,
      reserve_usdt_after REAL DEFAULT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create pool_reserves_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pool_reserves_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      reserve_token REAL NOT NULL,
      reserve_usdt REAL NOT NULL,
      virtual_reserve_token REAL NOT NULL,
      virtual_reserve_usdt REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      wallet_address TEXT(42) NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create comment likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      wallet_address TEXT(42) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(comment_id, wallet_address),
      FOREIGN KEY (comment_id) REFERENCES comments (id)
    )
  `);
  
  // Create pool_ratings table for gravity vote
  db.exec(`
    CREATE TABLE IF NOT EXISTS pool_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      wallet_address TEXT(42) NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      signature TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(pool_id, wallet_address),
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create price_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create hodlers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hodlers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      holder_username TEXT,
      holder_address TEXT(42) NOT NULL,
      holder_amount REAL NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Create gravity_scores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gravity_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      curve_utilization REAL NOT NULL,
      price_performance REAL NOT NULL,
      holder_metrics REAL NOT NULL, 
      community_engagement REAL NOT NULL,
      activity_score REAL NOT NULL,
      raw_score REAL NOT NULL,
      bonus_multiplier REAL NOT NULL,
      final_score REAL NOT NULL,
      calculation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools (id)
    )
  `);
  
  // Add indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pools_market_cap ON pools (market_cap DESC);
    CREATE INDEX IF NOT EXISTS idx_pools_volume ON pools (volume_24h DESC);
    CREATE INDEX IF NOT EXISTS idx_pools_gravity_score ON pools (gravity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_pool_timestamp ON transactions (pool_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_comments_pool_id ON comments (pool_id);
    CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes (comment_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_pool_timestamp ON price_history (pool_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_pool_ratings_pool_id ON pool_ratings (pool_id);
    CREATE INDEX IF NOT EXISTS idx_hodlers_pool_id ON hodlers (pool_id);
    CREATE INDEX IF NOT EXISTS idx_gravity_scores_pool_date ON gravity_scores (pool_id, calculation_date);
    CREATE INDEX IF NOT EXISTS idx_pool_reserves_history_pool_timestamp ON pool_reserves_history (pool_id, timestamp);
  `);
  
  // Run migrations to add new columns
  runMigrations(db);
  
  // Insert sample data if pools table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM pools').get();
  
  db.close();
  
  console.log('Database initialized successfully!');
};

// Get database connection
const getDbConnection = () => {
  return createConnection();
};

module.exports = {
  initializeDatabase,
  getDbConnection
}; 