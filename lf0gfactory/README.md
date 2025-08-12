# LF0G Factory - Token Graduation & Bonding Curve System

## Overview

LF0G Factory is a comprehensive platform for creating, managing, and trading tokens with an innovative hybrid pricing mechanism that combines:

1. **Bonding Curve Phase**: Initial token pricing using a constant product formula (`x * y = k`), similar to Uniswap V2
2. **Graduation System**: A transition mechanism to move tokens from bonding curve to traditional liquidity pool trading
3. **Gravity Score System**: A reward mechanism for token creators based on token performance metrics

This hybrid approach offers the best of both worlds - automatic price discovery via bonding curves during early stages, and efficient trading with deeper liquidity after graduation.

## Core Components

The system consists of several interconnected smart contracts:

- **TokenFactory**: Creates and tracks tokens, manages graduations
- **BondingCurveToken**: ERC-20 token with bonding curve pricing mechanism
- **GravityScoreSystem**: Tracks and updates performance metrics
- **LF0GSwapFactory**: Creates liquidity pair contracts for graduated tokens
- **LF0GSwapPair**: Manages token/USDT pools with constant product AMM
- **GraduationRegistry**: Tracks graduated tokens and their associated pairs

## Bonding Curve Mechanism

Tokens initially use a constant product bonding curve (`x * y = k`) for price discovery:

- **Buy**: Send USDT → mint new tokens → price increases
- **Sell**: Burn tokens → receive USDT → price decreases
- **Formula**: Price = USDT_reserves / token_reserves

### Virtual Reserves

The system uses virtual reserves to establish a sensible starting price:
- Initial USDT reserves: 100,000 USDT (6 decimals)
- Initial token reserves: 1,888,888,888 tokens (18 decimals)
- Initial price ≈ 0.000053 USDT per token

This allows for organic price growth without requiring large initial liquidity.

## Token Graduation System

The graduation process transitions a token from bonding curve to liquidity pool trading:

1. **Initiation**: Token owner calls `graduate()` to start the process
2. **Liquidity Creation**:
   - Tokens are minted (0.1% of total supply)
   - USDT from the token contract is used with these tokens
   - A new LF0GSwapPair is created with this initial liquidity
3. **Trading Migration**:
   - Bonding curve trading is disabled with `isTradingEnabled = false`
   - All trading now happens through the liquidity pool

### After Graduation

Once graduated:
- Tokens cannot be bought or sold through the bonding curve
- Trading continues through the newly created liquidity pool
- Users can access new `buy-pool` and `sell-pool` functions to trade
- Reserves in the pool are correctly synchronized using the `sync()` function
- The LP tokens are permanently locked to create a forever-liquid market

## Gravity Score System

The Gravity Score system provides incentives for token creators:

- **Score Range**: 0-1000, representing token performance
- **Thresholds**: 200, 400, 600, 800, 1000
- **Rewards**: Creators receive token rewards as thresholds are reached
- **Reward Pool**: 5% of total supply is reserved for creator rewards
- **Distribution**: Rewards unlocked progressively as thresholds are achieved

### Gravity Score Rewards

| Threshold | Percentage of Reserve | Cumulative |
|-----------|----------------------|------------|
| 200       | 0.5%                 | 0.5%       |
| 400       | 1.0%                 | 1.5%       |
| 600       | 2.0%                 | 3.5%       |
| 800       | 3.0%                 | 6.5%       |
| 1000      | 3.5%                 | 10.0%      |

## Fees

The system includes a small fee structure for sustainability:

- **Transaction Fee**: 0.1% on all buys and sells
- **Fee Collection**: Fees are sent to the treasury address
- **Fee Constants**: FEE_RATE = 100, FEE_DENOMINATOR = 100000

## Interactive Usage

The project includes JavaScript tools for interacting with the contracts:

```bash
# Deploy contracts
npm run deploy

# Create a new token
node interact.js create "Token Name" "TKN" "Token description"

# Graduate a token from bonding curve to liquidity pool
node interact.js graduate <token-address>

# Bonding curve interactions (pre-graduation)
node interact-token.js buy 1           # Buy tokens for 1 USDT
node interact-token.js sell 10         # Sell 10 tokens

# Liquidity pool interactions (post-graduation)
node interact-token.js buy-pool 1      # Buy tokens via pool for 1 USDT
node interact-token.js sell-pool 10    # Sell 10 tokens via pool

# Additional commands
node interact-token.js info            # Token information
node interact-token.js analyze-curve   # Analyze bonding curve
node interact-token.js update-gravity 800  # Update gravity score
node interact-token.js claim-tokens    # Claim creator rewards
```

## Technical Improvements

Recent improvements to the system include:

1. **Sync Function**: Added a `sync()` method to LF0GSwapPair that correctly updates reserves to match actual contract balances, fixing the discrepancy between reported and actual USDT in the pool.

2. **ABI Interface Fix**: Fixed missing `transfer()` method in USDT contract ABI interface to allow proper token transfers to the swap pair.

3. **Graduation Improvements**: Enhanced the token graduation process to ensure liquidity is correctly configured in the new pair.

4. **Allow USDT Fix**: Corrected issues with token approval by using proper internal `_approve()` method with correct parameters.

5. **Gas Estimation**: Implemented more conservative gas estimation with fallback options for more reliable transactions.

## Project Setup

### Requirements
- Node.js v20+
- npm/yarn

### Installation
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Configuration
Create a `.env` file with:
```
private_lf0g=your_private_key
wallet_lf0g=your_wallet_address
RPC_URL=https://your-rpc-url
```

## Architecture & Design Decisions

### Separation of Concerns
- **Token Factory**: Manages token creation and tracking
- **BondingCurveToken**: Handles pricing and trading logic
- **Swap Pair**: Implements post-graduation trading

### Upgradability
- The system uses a non-upgradable design for maximum decentralization
- New versions would require new deployments and migration strategies

### Security Considerations
- ReentrancyGuard protection on key trading functions
- Ownership controls for administrative functions
- SafeERC20 for reliable token transfers

## Future Enhancements

Potential improvements for future versions:

1. **Variable Fee Structure**: Different fees based on token age or volume
2. **Governance Mechanisms**: DAO-controlled treasury and fee parameters
3. **Multi-Token Pools**: Support for more complex trading pairs
4. **Order Types**: Limit orders and other advanced trading features
5. **Analytics Dashboard**: Real-time monitoring of token performance

## License

This project is licensed under the MIT License - see the LICENSE file for details. 