# lf0g.fun Client Architecture

## Overview

The lf0g.fun client is a React-based web application designed for interacting with ERC-20 tokens and pools. It provides functionality for creating tokens, viewing token details, managing user tokens, and interacting with pools. The client integrates with blockchain technologies through Web3 providers.

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6 
- **State Management**: Context API
- **Styling**: Material UI and custom CSS
- **Web3 Integration**: 
  - Rainbow Kit for wallet connection
  - Wagmi for blockchain interactions
  - Ethers.js for Ethereum interactions
  - Viem for low-level blockchain communications
- **Data Fetching**: Axios, React Query
- **Real-time Communication**: Socket.io
- **Code Editing**: Monaco Editor
- **UI Components**: MUI, Lucide React
- **Visualization**: Recharts

## Project Structure

### Main Components

- **src/index.js**: Application entry point
- **src/App.js**: Main component defining routes and providers

### Context Providers

The application uses multiple context providers for state management:
- **ThemeContext**: Manages application theme (light/dark)
- **RainbowProvider**: Handles wallet connections
- **TransactionContext**: Manages blockchain transactions
- **PriceContext**: Provides price data
- **PoolContext**: Manages pool data and interactions
- **NavigationContext**: Handles navigation state

### Pages

The application consists of several key pages:
- **HomePage**: Main landing page displaying pools
- **PoolDetailsPage**: Detailed view of a specific pool
- **MyTokensPage**: User's token holdings
- **CreateToken**: Interface for creating new tokens
- **DocsPage**: Documentation

### Components

Components are organized into logical directories:
- **layout/**: Layout components including headers, footers, and navigation
- **wallet/**: Wallet connection and management
- **pools/**: Pool-related components
- **ui/**: Reusable UI components
- **common/**: Shared utility components

### API Integration

The client interacts with backend services through several API modules:
- **poolsApi.js**: Pool data and operations
- **swapApi.js**: Token swap functionality
- **authApi.js**: Authentication
- **ratingsApi.js**: Token ratings
- **lf0gFactoryApi.js**: Factory contract interactions
- **poolTransactionsApi.js**: Transaction history
- **commentsApi.js**: User comments functionality
- **priceHistoryApi.js**: Historical price data

### Custom Hooks

The application leverages custom hooks for reusable logic:
- **useWallet.js**: Wallet connection and management
- **useSwap.js**: Token swap functionality
- **useSwapHelpers.js**: Helper functions for swap operations

## Key Features

1. **Wallet Integration**: Seamless connection to Ethereum wallets
2. **Token Creation**: Interface for creating new ERC-20 tokens
3. **Pool Management**: View and interact with token pools
4. **Token Swapping**: Exchange tokens within pools
5. **Transaction History**: View past transactions
6. **Price Charts**: Visualize token price history
7. **Theme Switching**: Toggle between light and dark themes

## User Experience

The application includes several UX enhancements:
- **Preload Screen**: Initial loading animation
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Comprehensive error states
- **Loading States**: Visual feedback during operations

## Architecture Pattern

The client follows a component-based architecture with context for state management. It uses a combination of:
- **Context API** for global state
- **Custom hooks** for reusable logic
- **API modules** for data fetching
- **Component composition** for UI construction

# lf0g.fun Server Architecture

## Overview

The lf0g.fun server is a Node.js-based backend application that provides API endpoints for the client application. It manages data storage, authentication, and business logic for the platform. The server connects to blockchain nodes to interact with smart contracts and stores relevant data in a SQLite database.

## Tech Stack

- **Framework**: Express.js
- **Database**: SQLite (Better-SQLite3)
- **Authentication**: JWT (JSON Web Tokens)
- **Blockchain Integration**: Ethers.js
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Real-time Communication**: Socket.io
- **Security**: Helmet, CORS
- **Scheduling**: Cron

## Project Structure

### Main Components

- **src/index.js**: Application entry point
- **src/db/init.js**: Database initialization
- **src/middleware/**: Request processing middleware
- **src/routes/**: API endpoint definitions
- **src/controllers/**: Business logic handlers
- **src/models/**: Data models and database queries
- **src/utils/**: Utility functions
- **src/scripts/**: Maintenance and background tasks

### API Endpoints

The API is organized into these main areas:

- **/api/pools**: Liquidity pool management
- **/api/users**: User authentication and management
- **/api/transactions**: Transaction recording and history
- **/api/comments**: Social commenting system
- **/api/ratings**: Token rating system
- **/api/gravity-score**: Gravity Score calculations

### Key Components

#### Controllers
Controllers handle business logic and API response formatting:

- **poolController.js**: Pool-related operations
- **userController.js**: User account management
- **transactionController.js**: Transaction processing
- **commentController.js**: Comment functionality
- **ratingController.js**: Rating functionality
- **gravityScoreController.js**: Gravity Score calculations

### Database Models

The application uses several data models:
- **Pool**: Represents a token pool with liquidity information
- **User**: User authentication and profile data
- **Rating**: User ratings for pools
- **Comment**: User comments on pools
- **GravityScore**: Calculated importance metrics for pools

### Middleware

The server employs several middleware components:
- **auth.js**: JWT-based authentication
- **CORS**: Cross-Origin Resource Sharing configuration
- **Helmet**: Security headers
- **Rate Limiting**: (Currently disabled but configured)

### Scripts

The server includes several utility scripts for maintenance tasks:
- **verifyPoolReserves.js**: Verifies on-chain pool data
- **updateGravityScore.js**: Updates gravity scores for pools

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **CORS Configuration**: Restricts API access to allowed origins
3. **Helmet Integration**: Adds security headers
4. **Input Validation**: Validates user input
5. **Rate Limiting**: Configured but currently disabled
6. **Environment Variables**: Secure configuration

## File Storage

The server provides file storage for:
- **Pool Images**: Stored in the uploads/pool-images directory
- **File Processing**: Images are processed with Sharp

# Client-Server Connections

## Overview

The client and server components of lf0g.fun communicate through various mechanisms, primarily RESTful API calls and WebSocket connections.

## REST API Connections

### Pool Management
- **Client**: `poolsApi.js` makes requests to server endpoints
- **Server**: `/api/pools` routes handle these requests
- **Function**: Retrieve, create, and update pool data

### Authentication
- **Client**: `authApi.js` connects to authentication endpoints
- **Server**: `/api/users` routes handle user authentication
- **Function**: User login, registration, and token validation

### Transactions
- **Client**: `poolTransactionsApi.js` records blockchain transactions
- **Server**: `/api/transactions` stores transaction records
- **Function**: Record and retrieve transaction history

### Ratings
- **Client**: `ratingsApi.js` sends user ratings
- **Server**: `/api/ratings` processes and stores ratings
- **Function**: User engagement through the gravity scoring system

### Comments
- **Client**: `commentsApi.js` handles user comments
- **Server**: `/api/comments` stores and retrieves comments
- **Function**: Social engagement through comments

### Pricing
- **Client**: `priceHistoryApi.js` fetches historical pricing
- **Server**: Stores and calculates price history
- **Function**: Display historical price charts

## WebSocket Connections

- **Client**: Uses Socket.io-client for real-time updates
- **Server**: Socket.io server provides push notifications
- **Functions**:
  - Real-time price updates
  - Transaction notifications
  - Pool status changes

## Blockchain Integration

- **Client**: Directly interacts with blockchain via Ethers.js/Wagmi
- **Server**: Monitors and verifies blockchain activity
- **Shared**: Both use Ethers.js for blockchain interactions
- **Functions**:
  - Token swaps
  - Liquidity provision
  - Contract verification

## Data Flow

1. **User Authentication**:
   - Client sends wallet signature
   - Server verifies and issues JWT token
   - Client stores token for authenticated requests

2. **Pool Data**:
   - Client requests pool listing
   - Server queries database and returns formatted data
   - Client renders pool information

3. **Transactions**:
   - Client initiates blockchain transaction
   - Client records transaction hash
   - Server verifies transaction and updates database
   - Client receives confirmation via WebSocket

4. **Social Engagement**:
   - Client sends ratings/comments
   - Server stores in database
   - Updates are pushed to all connected clients

# Transaction Broadcast Service

## Overview

The Transaction Broadcast Service is a dedicated WebSocket-based microservice responsible for real-time broadcasting of transaction and pool events across the lf0g.fun platform. It serves as a pub/sub (publish/subscribe) system that ensures all connected clients receive immediate updates about new transactions and pool creations.

## Tech Stack

- **Framework**: Express.js
- **WebSockets**: Socket.io
- **HTTP Server**: Node.js HTTP
- **Cross-Origin Resource Sharing**: CORS

## Architecture

The Transaction Broadcast Service follows a simple but effective architecture:

1. **Express Server**: Handles HTTP endpoints for manual broadcasting
2. **Socket.io Server**: Manages WebSocket connections and event broadcasting
3. **In-memory Storage**: Maintains recent transactions and pools for new clients

## Key Features

### Real-time Event Broadcasting
- Broadcasts new transactions to all connected clients
- Broadcasts new pool creations to all connected clients
- Maintains separate event channels for different types of notifications

### Connection Management
- Tracks connected clients and their session information
- Provides new clients with recent transaction and pool history upon connection
- Logs connection and disconnection events for monitoring

### API Endpoints
- **/api/broadcast-transaction**: HTTP endpoint for manually broadcasting transactions
- **/api/broadcast-pool**: HTTP endpoint for manually broadcasting new pools
- **/health**: Status endpoint for monitoring service health

### In-memory Caching
- Stores most recent transactions (up to 10)
- Stores most recent pool creations (up to 10)
- Ensures new clients receive recent activity upon connection

## Client-Server Communication

The service establishes bidirectional communication channels:

### Server to Client Events
- **new_transaction**: Broadcasts transaction details to all clients
- **new_pool**: Broadcasts new pool information to all clients
- **recent_transactions**: Sends transaction history to newly connected clients
- **recent_pools**: Sends pool history to newly connected clients

### Client to Server Events
- **broadcast_transaction**: Clients can broadcast transactions to all other clients
- **broadcast_pool**: Clients can broadcast new pools to all other clients

## Integration with Main Application

The Transaction Broadcast Service integrates with the main application in several ways:

1. **Client Integration**: The client application connects to this service via Socket.io client
2. **Server Integration**: The main server can trigger broadcasts through HTTP API endpoints
3. **Environment Configuration**: Shares environment variables with the main application

## Deployment Considerations

- Runs on a separate port (default: 3005)
- Supports both development and production modes
- Implements conditional logging based on environment
- Designed for horizontal scaling if needed
