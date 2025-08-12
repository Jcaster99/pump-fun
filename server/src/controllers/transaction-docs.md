# Transaction Recording Mechanism Documentation

This document explains the transaction recording flow from frontend user actions to database storage for buy/sell operations.

## Flow Overview

```
Frontend (React)                  API                     Backend (Node.js)
┌──────────────┐                ┌─────┐                  ┌───────────────┐
│              │                │     │                  │               │
│  User Action ├────────────────┤     ├──────────────────► API Controller│
│ (Buy/Sell)   │                │     │                  │ (record tx)   │
│              │                │     │                  │               │
└─────┬────────┘                └─────┘                  └───────┬───────┘
      │                                                          │
      ▼                                                          ▼
┌──────────────┐                                         ┌───────────────┐
│              │                                         │               │
│ Calculate    │                                         │Transaction    │
│ Swap Details │                                         │Listener       │
│              │                                         │               │
└─────┬────────┘                                         └───────┬───────┘
      │                                                          │
      ▼                                                          ▼
┌──────────────┐                                         ┌───────────────┐
│              │                                         │               │
│ Execute Swap │                                         │ Pool Model    │
│              │                                         │               │
└─────┬────────┘                                         └───────┬───────┘
      │                                                          │
      ▼                                                          ▼
┌──────────────┐                                         ┌───────────────┐
│              │                                         │               │
│ Save Tx Data │                                         │ Database      │
│              │                                         │               │
└──────────────┘                                         └───────────────┘
```

## Frontend Components

### 1. User Initiates Transaction (PoolActionPanel.js)

- User enters amount in input field
- System calculates expected tokens (buy) or USDT (sell) via `calculateSwap`
- User clicks "Buy" or "Sell" button
- `handleSubmit` function collects data and stores in `lastTradeInfo`:
  ```javascript
  setLastTradeInfo({
    inputAmount: parseFloat(amount),
    expectedAmount: calculatedData?.expectedAmount ?? 0,
    type: activeTab === 'buy' ? 'buy' : 'sell'
  });
  ```

### 2. Transaction Execution (useSwap.js)

- Blockchain transaction is executed via wallet
- On success, transaction hash is stored in `lastSwapHash`
- `useEffect` watches for `lastSwapHash` changes

### 3. Recording Transaction (PoolActionPanel.js)

- Upon successful transaction, frontend calls `savePoolTransaction`:
  ```javascript
  const isBuy = lastTradeInfo.type === 'buy';
  await savePoolTransaction({
    contract_address: pool.token_address || pool.contract_address,
    wallet_address: wallet.address,
    tx_hash: lastSwapHash,
    type: lastTradeInfo.type,
    token_amount: isBuy ? lastTradeInfo.expectedAmount : lastTradeInfo.inputAmount,
    usdt_amount: isBuy ? lastTradeInfo.inputAmount : lastTradeInfo.expectedAmount,
    price: calculatedData?.currentPrice || pool.price
  });
  ```

### 4. API Client (poolTransactionsApi.js)

- Validates and sanitizes data
- Fetches pool information from API
- Sends transaction data to backend:
  ```javascript
  const transactionData = {
    contract_address: transaction.contract_address || (poolData?.data?.token_address ?? ''),
    type: transaction.type || 'buy',
    tx_hash: transaction.tx_hash,
    wallet_address: transaction.wallet_address,
    token_amount: tokenAmount,
    usdt_amount: usdtAmount,
    price
  };
  ```

## Backend Components

### 1. API Controller (transactionsController.js)

- Receives transaction data via `recordTransaction` endpoint
- Extracts and validates data:
  ```javascript
  const {
    contract_address: contractAddress,
    token_amount: tokenAmount,
    usdt_amount: usdtAmount,
    type,
    tx_hash: txHash,
    wallet_address: walletAddress
  } = req.body;
  ```
- Delegates to appropriate handler based on transaction type

### 2. Transaction Processor (TransactionListener.js)

- Handles buy transactions via `handleBuyTransaction`:
  ```javascript
  // Receives exact token and USDT amounts from frontend
  listenerResult = await TransactionListener.handleBuyTransaction({
    poolContractAddress: contractAddress,
    txHash,
    walletAddress,
    usdtAmount,
    tokenAmount
  });
  ```
- Handles sell transactions via `handleSellTransaction`:
  ```javascript
  listenerResult = await TransactionListener.handleSellTransaction({
    poolContractAddress: contractAddress,
    txHash,
    walletAddress,
    tokenAmount,
    usdtAmount
  });
  ```
- Updates pool reserves using precise decimal.js math
- Prevents duplicate transactions based on txHash

### 3. Pool Model (pool.js)

- Uses `decimal.js` for precise calculations
- Updates pool reserves:
  ```javascript
  // Aktualizacja rezerw
  db.prepare(`
    UPDATE pools 
    SET reserve_token = ?, reserve_usdt = ?
    WHERE id = ?
  `).run(newReserveToken, newReserveUsdt, poolId);
  ```
- Records transaction details in database
- Updates price history and reserves history

## Data Flow Details

### Buy Transaction Flow

1. User inputs USDT amount to spend
2. Frontend calculates expected token amount
3. User confirms and signs blockchain transaction
4. After successful transaction, frontend sends:
   - `token_amount`: Expected tokens received
   - `usdt_amount`: USDT amount spent
   - Transaction type: "buy"
5. Backend receives data and delegates to `handleBuyTransaction`
6. Transaction Listener:
   - Verifies pool existence
   - Checks for duplicate transaction
   - Uses provided token/USDT values rather than recalculating
   - Updates pool reserves
   - Records transaction in database

### Sell Transaction Flow

1. User inputs token amount to sell
2. Frontend calculates expected USDT amount
3. User confirms and signs blockchain transaction
4. After successful transaction, frontend sends:
   - `token_amount`: Token amount sold
   - `usdt_amount`: Expected USDT received
   - Transaction type: "sell"
5. Backend receives data and delegates to `handleSellTransaction`
6. Transaction Listener:
   - Verifies pool existence
   - Checks for duplicate transaction
   - Uses provided token/USDT values rather than recalculating
   - Updates pool reserves
   - Records transaction in database

## Key Improvements in New System

1. **Precision**: Uses user-visible values instead of recalculating at each step
2. **Reliability**: Eliminates calculation discrepancies between frontend and backend
3. **Consistency**: Ensures what the user sees is what gets recorded in the database
4. **Transparency**: Frontend values precisely match what's stored in database
5. **Data Integrity**: Complete decimal.js precision for critical calculations

## Debugging

In case of issues, check the following:

1. Frontend console logs in `poolTransactionsApi.js`
2. Backend error logs in `transactionListener.js`
3. Transaction hash uniqueness (prevent duplicates)
4. API connection between frontend and backend
5. Pool existence by contract address

## Database Schema (Relevant Tables)

- `pools`: Stores pool information and current reserves
- `transactions`: Records all buy/sell transactions
- `pool_reserves_history`: Tracks changes to pool reserves over time
- `price_history`: Records price changes after transactions 