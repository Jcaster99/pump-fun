/**
 * Database Backup Script for lf0g.fun
 * 
 * This script creates automated backups of all database services:
 * - Main postgres database
 * - Blog service database 
 * - Leaderboard service database
 * 
 * Backups are stored in the /backups directory with timestamps.
 * 
 * Usage:
 *   node backup-databases.js [--output=path/to/backup/dir]
 * 
 * Options:
 *   --output  Specify a custom output directory for backups (default: ./backups)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let outputDir = path.join(__dirname, 'backups');

for (const arg of args) {
  if (arg.startsWith('--output=')) {
    outputDir = arg.substring('--output='.length);
    // Convert relative to absolute path if needed
    if (!path.isAbsolute(outputDir)) {
      outputDir = path.join(__dirname, outputDir);
    }
  }
}

// Get current date for backup filename
const getDateString = () => {
  const now = new Date();
  return now.getFullYear() +
    '_' + String(now.getMonth() + 1).padStart(2, '0') +
    '_' + String(now.getDate()).padStart(2, '0') +
    '_' + String(now.getHours()).padStart(2, '0') +
    '_' + String(now.getMinutes()).padStart(2, '0') +
    '_' + String(now.getSeconds()).padStart(2, '0');
};

// Database paths relative to script
const databases = [
  {
    name: 'server',
    path: path.join(__dirname, 'server', 'data.sqlite')
  },
  {
    name: 'leaderboard',
    path: path.join(__dirname, 'leaderboard-service', 'leaderboard.sqlite')
  }
];

// Ensure backup directory exists
if (!fs.existsSync(outputDir)) {
  console.log(`Creating backup directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

// Backup each database
const backupDatabase = (dbPath, dbName) => {
  try {
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Error: Database file not found: ${dbPath}`);
      return false;
    }

    // Get database file size
    const stats = fs.statSync(dbPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`Database ${dbName} size: ${fileSizeMB.toFixed(2)} MB`);

    // Create backup file name with timestamp
    const dateStr = getDateString();
    const backupFileName = `${dbName}_${dateStr}.sqlite`;
    const backupPath = path.join(outputDir, backupFileName);

    // Different backup methods based on platform
    if (process.platform === 'win32') {
      // On Windows, simple file copy is usually sufficient
      fs.copyFileSync(dbPath, backupPath);
    } else {
      // On Linux/Mac, use sqlite3 backup command if available
      try {
        // This creates an optimized backup (can also fix some corruption issues)
        execSync(`sqlite3 "${dbPath}" ".backup '${backupPath}'"`, { stdio: 'pipe' });
      } catch (err) {
        // Fallback to file copy if sqlite3 command fails
        console.log(`SQLite command failed, using file copy instead: ${err.message}`);
        fs.copyFileSync(dbPath, backupPath);
      }
    }

    console.log(`Backup created: ${backupPath}`);
    
    // Optional: Remove old backups
    cleanupOldBackups(dbName);
    
    return true;
  } catch (err) {
    console.error(`Error backing up ${dbName} database:`, err);
    return false;
  }
};

// Clean up old backups (keep last 10)
const cleanupOldBackups = (dbName) => {
  try {
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith(`${dbName}_`) && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(outputDir, file),
        time: fs.statSync(path.join(outputDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by modification time (newest first)
      
    // Keep only the latest 10 backups
    const MAX_BACKUPS = 10;
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`Removed old backup: ${file.name}`);
      }
    }
  } catch (err) {
    console.error(`Error cleaning up old backups:`, err);
  }
};

// Main function
const main = () => {
  console.log(`Starting database backup at ${new Date().toISOString()}`);
  console.log(`Backup directory: ${outputDir}`);
  
  // Track success/failure
  let success = true;
  
  // Backup each database
  for (const db of databases) {
    console.log(`\nBacking up ${db.name} database...`);
    const result = backupDatabase(db.path, db.name);
    if (!result) success = false;
  }
  
  console.log(`\nBackup completed at ${new Date().toISOString()}`);
  console.log(`Status: ${success ? 'All databases backed up successfully' : 'Some backups failed'}`);
  
  return success ? 0 : 1;
};

// Run the main function
const exitCode = main();
process.exit(exitCode); 