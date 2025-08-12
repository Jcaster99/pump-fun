# Server

Backend API for lf0g.fun pool tracking application.

## Running the Server

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Gravity Score System

The application incorporates a Gravity Score system which ranks pools based on multiple factors:

- Core Factors (Liquidity ratio, Market stability, Holder distribution)
- Momentum Factors (Transaction rate, Volume growth, Price growth)
- Community Factors (Community rating, Engagement score, Activity spread)
- Innovation Factors (Social media presence, Sustainability index, Technology integration)

### Updating Gravity Scores

Gravity scores are calculated on-demand using the following commands:

```bash
# Update gravity scores for all pools
npm run update-gravity-scores

# Update gravity score for a specific pool
npm run update-pool-gravity=123  # Replace 123 with the pool ID
```

For administrative users, gravity scores can also be updated via the API:

```
POST /api/gravity-score/update-all
POST /api/gravity-score/recalculate/:poolId
```

### Gravity Score API Endpoints

```
GET /api/gravity-score/pool/:poolId       # Get detailed score for a specific pool
GET /api/gravity-score/pool/:poolId/history  # Get historical scores for a pool
GET /api/gravity-score/top                # Get top pools by gravity score
```

## Database

The application uses SQLite with tables for:
- Pools
- Transactions
- Comments
- Ratings
- Price history
- Holders data
- Gravity scores

## Other Scripts

```bash
# Reset database
npm run reset-db

# Verify pool reserves
npm run verify-pools
``` 