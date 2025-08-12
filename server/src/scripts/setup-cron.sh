#!/bin/bash

# Script to set up cron job for pool cleanup
# Run as a user who has permission to run the cleanup script

# Configuration variables
SERVER_DIR=$(realpath $(dirname "$0")/../..)
SCRIPT_PATH="$SERVER_DIR/src/scripts/cleanInactivePools.js"
LOG_DIR="/var/log/lf0g"
LOG_FILE="$LOG_DIR/pool-cleanup.log"
CRON_SCHEDULE="0 0 * * *"  # Default: Every day at midnight

# Function to print usage information
print_usage() {
    echo "Usage: $0 [--schedule \"CRON_SCHEDULE\"]"
    echo "Example: $0 --schedule \"0 2 * * *\"  # Run every day at 2:00 AM"
    echo "Default schedule is: $CRON_SCHEDULE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --schedule)
            CRON_SCHEDULE="$2"
            shift 2
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Create log directory if it doesn't exist
echo "Creating log directory: $LOG_DIR"
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create log directory. Run with sudo or create the directory manually."
        exit 1
    fi
    chmod 755 "$LOG_DIR"
fi

# Verify script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Cleanup script not found at $SCRIPT_PATH"
    exit 1
fi

# Create cron job
CRON_JOB="$CRON_SCHEDULE cd $SERVER_DIR && node $SCRIPT_PATH >> $LOG_FILE 2>&1"

# Check if cron job already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "cleanInactivePools.js")

if [ -n "$EXISTING_CRON" ]; then
    echo "Found existing cron job for pool cleanup:"
    echo "$EXISTING_CRON"
    
    read -p "Do you want to replace it? (y/n): " REPLACE
    if [[ "$REPLACE" != "y" && "$REPLACE" != "Y" ]]; then
        echo "Aborted. Existing cron job not modified."
        exit 0
    fi
    
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "cleanInactivePools.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "# lf0g.fun - Clean inactive pools") | crontab -
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "Successfully set up cron job:"
    echo "$CRON_JOB"
    echo "Logs will be written to: $LOG_FILE"
else
    echo "Error: Failed to set up cron job"
    exit 1
fi

# Test if Node.js can execute the script
echo "Testing script execution..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Warning: Node.js not found in PATH. Make sure Node.js is installed and in PATH for the cron job to run."
else
    echo "Node.js version: $NODE_VERSION"
    
    # Test script syntax
    node --check "$SCRIPT_PATH"
    if [ $? -eq 0 ]; then
        echo "Script syntax check passed."
    else
        echo "Warning: Script syntax check failed. Please fix the script before running via cron."
    fi
fi

echo "Setup complete. Cron job will run at the specified schedule." 