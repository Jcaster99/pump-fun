# Frontend Structure

## HomePage (`client/src/pages/HomePage.js`)

```
client/src/pages/HomePage.js
|
|-- components/
|   |-- pools/
|   |   |-- TrendingPools.js
|   |   |-- PoolsTicker.js
|   |-- common/
|   |   |-- ParticleBackground.js
|-- context/
|   |-- ThemeContext.js
|-- api/
|   |-- poolsApi.js
```

**Key Components:**
- `TrendingPools`: (client/src/components/pools/TrendingPools.js) - Displays trending pools.
- `PoolsTicker`: (client/src/components/pools/PoolsTicker.js) - Shows a ticker of pool prices.
- `ParticleBackground`: (client/src/components/common/ParticleBackground.js) - Renders a particle effect background.

---

## Create Token Page

This page is composed of multiple main files:
- `client/src/pages/CreateToken.js` (Main page logic and layout)
- `client/src/pages/CreateTokenForm.js` (Handles form structure and state)
- `client/src/pages/CreateTokenFormSections.js` (Defines individual sections of the form)

```
client/src/pages/CreateToken.js
|
|-- ./CreateTokenForm.js
|   |
|   |-- ./CreateTokenFormSections.js
|       |
|       |-- ../components/common/LoadingSpinner.js
|
|-- ../components/
|   |-- common/
|   |   |-- ParticleBackground.js
|   |-- TokenCreation/
|   |   |-- TransactionOverlay.js
|-- ../context/
|   |-- ThemeContext.js
|   |-- NavigationContext.js
|-- ../hooks/
|   |-- useWallet.js
|   |-- useNSFWDetection.js
|   |-- useCreateToken.js
```

**Key Components:**
- `CreateTokenForm`: (client/src/pages/CreateTokenForm.js) - The main form component.
    - `WalletNotConnectedView`: (client/src/pages/CreateTokenFormSections.js) - View shown when wallet is not connected.
    - `TokenDetailsSection`: (client/src/pages/CreateTokenFormSections.js) - Section for token name, symbol, description.
    - `SocialMediaSection`: (client/src/pages/CreateTokenFormSections.js) - Section for social media links.
    - `TokenImageSection`: (client/src/pages/CreateTokenFormSections.js) - Section for uploading token image.
    - `SubmitSection`: (client/src/pages/CreateTokenFormSections.js) - Section for the submit button and fee display.
    - `LoadingSpinner`: (client/src/components/common/LoadingSpinner.js) - Used within sections.
- `ParticleBackground`: (client/src/components/common/ParticleBackground.js) - Background effect.
- `TransactionOverlay`: (client/src/components/TokenCreation/TransactionOverlay.js) - Overlay for transaction progress.

---

## My Tokens Page (`client/src/pages/MyTokensPage.js`)

```
client/src/pages/MyTokensPage.js
|
|-- ../components/
|   |-- pools/
|   |   |-- PoolCard.js
|   |-- common/
|   |   |-- LoadingSpinner.js
|   |   |-- ParticleBackground.js
|-- ../context/
|   |-- ThemeContext.js
|   |-- NavigationContext.js
|-- ../hooks/
|   |-- useWallet.js
|-- api/  (implicitly, via fetch to process.env.REACT_APP_API_URL)
```

**Key Components:**
- `PoolCard`: (client/src/components/pools/PoolCard.js) - Displays information for each token created by the user.
- `LoadingSpinner`: (client/src/components/common/LoadingSpinner.js) - Shown while loading data.
- `ParticleBackground`: (client/src/components/common/ParticleBackground.js) - Background effect.

---

## Leaderboard Page (`client/src/pages/LeaderboardPage.js`)

The content of `client/src/pages/LeaderboardPage.js` is currently commented out. If it were active, its structure would likely be:

```
client/src/pages/LeaderboardPage.js (Commented Out)
|
|-- ../components/
|   |-- leaderboard/
|   |   |-- LeaderboardTable.js
|   |-- common/
|   |   |-- ErrorDisplay.js
|   |   |-- RefreshButton.js
|-- ../api/
|   |-- leaderboardService.js
```

**Key Components (if active):**
- `LeaderboardTable`: (client/src/components/leaderboard/LeaderboardTable.js) - Table to display leaderboard data.
- `ErrorDisplay`: (client/src/components/common/ErrorDisplay.js) - Component to show errors.
- `RefreshButton`: (client/src/components/common/RefreshButton.js) - Button to refresh data.


---

## Swap Functionality (within Pool Details Page)

The primary "Swap" or trading functionality for tokens after they graduate from the bonding curve is handled within the `PoolDetailsPage`. The page also links to an external swap site (`swap.lf0g.fun`) once a token has graduated. The direct buy/sell actions on the bonding curve happen here.

Page files:
- `client/src/pages/PoolDetailsPage/PoolDetailsPage.View.js` (View logic)
- `client/src/pages/PoolDetailsPage/PoolDetailsPage.Logic.js` (Business logic)
- `client/src/pages/PoolDetailsPage/index.js` (Exports the component)

```
client/src/pages/PoolDetailsPage/PoolDetailsPage.View.js
|
|-- ../../components/
|   |-- pools/
|   |   |-- PoolDetailHeader.js
|   |   |-- PoolPriceChart.js
|   |   |-- PoolActionPanel.js  <-- Likely handles Buy/Sell interactions
|   |   |-- TopHoldersList.js
|   |   |-- PoolTransactionHistory.js
|   |   |-- Socials.js
|   |   |-- PoolRewards.js
|   |   |-- GraduationModal.js
|   |-- common/
|   |   |-- LoadingSpinner.js
```

**Key Components related to Swapping/Trading on Bonding Curve:**
- `PoolActionPanel`: (client/src/components/pools/PoolActionPanel.js) - This is the most likely component for handling direct buy/sell actions on the token's bonding curve before graduation.
- `PoolPriceChart`: (client/src/components/pools/PoolPriceChart.js) - Displays the price chart, relevant for trading decisions.
- `PoolDetailHeader`: (client/src/components/pools/PoolDetailHeader.js) - Displays token information.
- `GraduationModal`: (client/src/components/pools/GraduationModal.js) - Handles the token graduation process. After graduation, users are directed to `swap.lf0g.fun`.

The page also contains logic to display a "Trade on Swap" button linking to `https://swap.lf0g.fun` when a token is graduated.
