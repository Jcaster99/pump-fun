// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// Interface for TokenFactory to avoid circular import
interface ILF0GTokenFactory {
    function graduateToken(address token, uint256 usdtAmount, uint256 tokenAmount) external returns (address pairAddress);
    function isTokenCreator(address potentialCreator, address tokenAddress) external view returns (bool);
}

// Minimal interface to interact with the pair for synchronising reserves
interface ILF0GPairSync {
    function sync() external;
}

/**
 * @title BondingCurveToken
 * @dev Token z mechanizmem bonding curve używającym USDT jako waluty bazowej
 */
contract BondingCurveToken is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Adres kontraktu USDT
    address public immutable USDT;
    
    // Stała dla decimals USDT
    uint8 public constant USDT_DECIMALS = 18; // USDT na 0G Galileo Testnet ma 18 decimals
    
    // Parametry bonding curve
    uint256 public constant CURVE_FACTOR = 1e15; // Współczynnik krzywej
    uint256 public constant PRECISION = 1e18;    // Precyzja dla obliczeń
    
    // Opłata transakcyjna (0.1%)
    uint256 public constant FEE_RATE = 100;
    uint256 public constant FEE_DENOMINATOR = 100000;
    
    // Parametry tokenu
    string public description;
    address public factory;
    
    // Rezerwy tokenów i USDT
    uint256 public usdtReserves;
    uint256 public tokenReserves;
    uint256 public k; // Stały produkt x*y=k
    
    // Wirtualne rezerwy (do inicjalizacji)
    uint256 public constant VIRTUAL_USDT_RESERVES = 100_000 * 10**USDT_DECIMALS; // 100,000 USDT (18 decimals)
    uint256 public constant VIRTUAL_TOKEN_RESERVES = 1_888_888_888 * 1e18; // ~1.89B tokens
    
    // Stałe dla progów Gravity Score
    uint256[] public gravityThresholds = [200, 400, 600, 800, 1000];
    uint256[] public unlockPercentages = [500, 1000, 2000, 3000, 3500]; // w setnych częściach procenta
    
    // Rezerwa dla twórcy (5% całkowitej podaży)
    uint256 public constant CREATOR_RESERVE_PERCENT = 5;
    uint256 public creatorReserve;
    
    // Aktualny Gravity Score
    uint256 public gravityScore = 0;
    
    // Mapa osiągniętych progów
    mapping(uint256 => bool) public thresholdReached;
    
    // Mapa odblokowanych tokenów dla każdego progu
    mapping(uint256 => uint256) public unlockedTokens;
    
    // Łączna ilość odblokowanych tokenów
    uint256 public totalUnlockedTokens = 0;
    
    // Skarbiec na opłaty
    address public treasury;
    
    // Graduation flags and pair address
    bool public isGraduated = false;
    bool public isTradingEnabled = true;
    address public swapPair;
    
    // Event emitted when the token graduates and liquidity pool is created
    event TokenGraduated(address indexed tokenAddress, address indexed pairAddress, uint256 usdtAmount, uint256 tokenAmount, uint256 timestamp);
    
    // Zdarzenia
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount, uint256 feeAmount);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 usdtAmount, uint256 feeAmount);
    event GravityScoreUpdated(uint256 oldScore, uint256 newScore);
    event ThresholdReached(uint256 threshold, uint256 tokensUnlocked);
    event FeeCollected(address indexed user, uint256 amount);
    
    /**
     * @dev Konstruktor tokenów
     * @param _name Nazwa tokenu
     * @param _symbol Symbol tokenu
     * @param _description Opis tokenu
     * @param _creator Adres twórcy tokenu
     * @param _treasury Adres skarbca na opłaty
     * @param _usdt Adres kontraktu USDT
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        address _creator,
        address _treasury,
        address _usdt
    ) ERC20(_name, _symbol) Ownable() {
        description = _description;
        factory = msg.sender;
        treasury = _treasury;
        USDT = _usdt;
        
        // Inicjalizacja rezerw i stałej k
        usdtReserves = VIRTUAL_USDT_RESERVES;
        tokenReserves = VIRTUAL_TOKEN_RESERVES;
        k = usdtReserves * tokenReserves;
        
        // Oblicz rezerwę dla twórcy
        creatorReserve = (VIRTUAL_TOKEN_RESERVES * CREATOR_RESERVE_PERCENT) / 100;
        
        // Transfer ownership to creator
        _transferOwnership(_creator);
    }
    
    /**
     * @dev Kupuje tokeny za USDT
     * @param usdtAmount Ilość USDT do wydania
     */
    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be > 0");
        require(isTradingEnabled, "Trading disabled after graduation");
        
        // Obliczenie ilości tokenów do kupienia
        uint256 tokensOut = calculatePurchaseAmount(usdtAmount);
        require(tokensOut > 0, "Zero tokens to mint");
        
        // Oblicz opłatę 0.1% w USDT
        uint256 fee = (usdtAmount * FEE_RATE) / FEE_DENOMINATOR;
        uint256 totalUsdtAmount = usdtAmount + fee;
        
        // Aktualizacja rezerw - tylko usdtAmount (bez fee) idzie do rezerwy
        usdtReserves += usdtAmount;
        tokenReserves -= tokensOut;
        k = usdtReserves * tokenReserves;
        
        // Transfer całkowitej kwoty USDT (usdtAmount + fee) od użytkownika do kontraktu
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), totalUsdtAmount);
        
        // Transfer opłaty w USDT do skarbca
        if (fee > 0) {
            IERC20(USDT).safeTransfer(treasury, fee);
            emit FeeCollected(msg.sender, fee);
        }
        
        // Mint tokens dla kupującego
        _mint(msg.sender, tokensOut);
        
        emit TokensPurchased(msg.sender, usdtAmount, tokensOut, fee);
    }
    
    /**
     * @dev Sprzedaje tokeny za USDT
     * @param tokenAmount Ilość tokenów do sprzedania
     */
    function sell(uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");
        require(isTradingEnabled, "Trading disabled after graduation");
        
        // Obliczenie ilości USDT do wypłaty
        uint256 usdtOut = calculateSaleReturn(tokenAmount);
        require(usdtOut > 0, "Zero USDT to return");
        
        // Oblicz opłatę 0.1% w USDT
        uint256 fee = (usdtOut * FEE_RATE) / FEE_DENOMINATOR;
        uint256 finalUsdtOut = usdtOut - fee;
        
        // Aktualizacja rezerw
        usdtReserves -= usdtOut;
        tokenReserves += tokenAmount;
        k = usdtReserves * tokenReserves;
        
        // Burn tokens
        _burn(msg.sender, tokenAmount);
        
        // Transfer USDT do sprzedającego (po odjęciu opłaty)
        IERC20(USDT).safeTransfer(msg.sender, finalUsdtOut);
        
        // Transfer opłaty w USDT do skarbca
        if (fee > 0) {
            IERC20(USDT).safeTransfer(treasury, fee);
            emit FeeCollected(msg.sender, fee);
        }
        
        emit TokensSold(msg.sender, tokenAmount, finalUsdtOut, fee);
    }
    
    /**
     * @dev Aktualizuje Gravity Score
     * @param _newScore Nowy Gravity Score
     */
    function updateGravityScore(uint256 _newScore) external {
        // Tylko factory lub właściciel może aktualizować score
        require(msg.sender == factory || msg.sender == owner(), "Not authorized");
        require(_newScore <= 1000, "Gravity Score cannot exceed 1000");
        
        uint256 oldScore = gravityScore;
        gravityScore = _newScore;
        
        emit GravityScoreUpdated(oldScore, _newScore);
        
        // Sprawdź progi do odblokowania nagród
        checkThresholds();
    }
    
    /**
     * @dev Sprawdza progi Gravity Score i odblokowuje nagrody
     */
    function checkThresholds() internal {
        for (uint256 i = 0; i < gravityThresholds.length; i++) {
            uint256 threshold = gravityThresholds[i];
            
            if (gravityScore >= threshold && !thresholdReached[threshold]) {
                thresholdReached[threshold] = true;
                
                // Oblicz ilość tokenów do odblokowania
                uint256 tokensToUnlock = creatorReserve * unlockPercentages[i] / 10000;
                unlockedTokens[threshold] = tokensToUnlock;
                totalUnlockedTokens += tokensToUnlock;
                
                emit ThresholdReached(threshold, tokensToUnlock);
            }
        }
    }
    
    /**
     * @dev Odbiera odblokowane tokeny
     */
    function claimUnlockedTokens() external nonReentrant {
        // Funkcja może być wywołana bezpośrednio przez twórcę (owner) **lub** pośrednio przez TokenFactory
        // aby ułatwić claim w przypadkach, gdy UI korzysta z metody w fabryce.
        require(
            msg.sender == owner() || msg.sender == factory,
            "Only creator or factory can claim"
        );

        require(totalUnlockedTokens > 0, "No tokens to claim");

        uint256 tokensToTransfer = totalUnlockedTokens;
        totalUnlockedTokens = 0;

        // Zawsze mintujemy tokeny bezpośrednio na adres twórcy (owner()) – niezależnie od tego, kto wywołał funkcję
        _mint(owner(), tokensToTransfer);
    }
    
    /**
     * @dev Allows the TokenFactory to mint the unlocked tokens directly to any recipient (typically the creator).
     * This bypasses the msg.sender == owner requirement and is useful when the UI triggers the claim via factory.
     * Can be invoked only by `factory` and only if there are unlocked tokens.
     * After minting, the unlocked counter is reset to zero.
     */
    function claimByFactory(address recipient) external nonReentrant {
        require(msg.sender == factory, "Only factory can claim");
        require(totalUnlockedTokens > 0, "No tokens to claim");
        require(recipient != address(0), "Recipient is zero");
        
        // Verify that recipient is the token creator according to factory records
        require(
            recipient == owner() || ILF0GTokenFactory(factory).isTokenCreator(recipient, address(this)),
            "Recipient is not token creator"
        );

        uint256 amount = totalUnlockedTokens;
        totalUnlockedTokens = 0;

        _mint(recipient, amount);
    }
    
    /**
     * @dev Oblicza ilość tokenów, które zostaną wybite przy wpłacie określonej ilości USDT
     * @param _usdtAmount Ilość USDT (w jednostkach z 6 decimals)
     * @return Ilość tokenów do wybicia (w jednostkach z 18 decimals)
     */
    function calculatePurchaseAmount(uint256 _usdtAmount) public view returns (uint256) {
        // Formuła: tokeny_do_otrzymania = token_reserves - k/(usdt_reserves + usdt_amount)
        uint256 newUsdtReserves = usdtReserves + _usdtAmount;
        uint256 newTokenReserves = k / newUsdtReserves;
        
        // Ilość tokenów to różnica
        if (newTokenReserves >= tokenReserves) return 0;
        return tokenReserves - newTokenReserves;
    }
    
    /**
     * @dev Oblicza ilość USDT, która zostanie zwrócona przy sprzedaży określonej ilości tokenów
     * @param _tokenAmount Ilość tokenów do sprzedania (w jednostkach z 18 decimals)
     * @return Ilość USDT do zwrotu (w jednostkach z 6 decimals)
     */
    function calculateSaleReturn(uint256 _tokenAmount) public view returns (uint256) {
        // Formuła: usdt_do_otrzymania = usdt_reserves - k/(token_reserves + token_amount)
        uint256 newTokenReserves = tokenReserves + _tokenAmount;
        uint256 newUsdtReserves = k / newTokenReserves;
        
        // Ilość USDT to różnica
        if (newUsdtReserves >= usdtReserves) return 0;
        return usdtReserves - newUsdtReserves;
    }
    
    /**
     * @dev Zwraca aktualną cenę tokenu (cena za 1 token w USDT)
     * @return Cena za 1 token w USDT
     */
    function getCurrentPrice() public view returns (uint256) {
        // Formuła: price = usdt_reserves / token_reserves
        // Uwzględnienie różnicy w decimals między USDT (6) a tokenem (18)
        return (usdtReserves * 1e18) / tokenReserves;
    }
    
    /**
     * @dev Zwraca aktualną kapitalizację rynkową (w USDT)
     * @return Kapitalizacja rynkowa
     */
    function getMarketCap() public view returns (uint256) {
        // Precyzja obliczeń - uwzględnia różnicę w decimals
        return (getCurrentPrice() * tokenReserves) / 1e18;
    }
    
    /**
     * @dev Oblicza opłatę dla transakcji o określonej wartości USDT
     * @param _amount Wartość transakcji w USDT
     * @return Wysokość opłaty w USDT
     */
    function calculateFee(uint256 _amount) public pure returns (uint256) {
        return (_amount * FEE_RATE) / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Graduates the token – closes bonding-curve trading, adds liquidity to LF0G Swap and registers in the factory/registry.
     * Can be executed only once by the token owner.
     *
     * Requirements:
     * - the caller must be the owner.
     * - the token must not be graduated yet.
     *
     * Workflow:
     * 1. Disable trading via bonding curve.
     * 2. Mint 20 % of total supply to this contract.
     * 3. Approve TokenFactory to pull USDT & freshly-minted tokens.
     * 4. Call TokenFactory.graduateToken() which creates the swap pair, transfers liquidity and registers the token.
     */
    function graduate() external onlyOwner nonReentrant {
        require(!isGraduated, "Token is already graduated");

        // Step 1: mark as graduated & disable BC trading
        isGraduated = true;
        isTradingEnabled = false;

        // Step 2: calculate liquidity amounts
        // Ustal prawdziwą ilość posiadanych USDT (mogą być tylko wirtualne) 
        uint256 contractUsdtBalance = IERC20(USDT).balanceOf(address(this));
        uint256 usdtAmount = contractUsdtBalance;
        // Zmieniamy z 0.1% na 20% całkowitej podaży
        uint256 tokenAmount = (totalSupply() * 20) / 100; // 20% of current supply

        // Mint tokensAmount to this contract so they can be moved into the LP
        _mint(address(this), tokenAmount);

        // Step 3: approve factory for transfers (USDT & token)
        // Ustaw allowance z adresu kontraktu (address(this)) na TokenFactory, aby mogła pobrać tokeny
        _approve(address(this), factory, tokenAmount);

        // Step 4: call the factory bez transferowania USDT - przeprowadzimy to bezpośrednio
        address pairAddress = ILF0GTokenFactory(factory).graduateToken(address(this), 0, tokenAmount);
        swapPair = pairAddress;
        
        // Step 5: Teraz gdy mamy adres pary, prześlij USDT bezpośrednio
        if (usdtAmount > 0) {
            IERC20(USDT).safeTransfer(pairAddress, usdtAmount);

            // Zaktualizuj rezerwy w kontrakcie pary, aby odzwierciedlić prawdziwe salda
            ILF0GPairSync(pairAddress).sync();
        }
        
        emit TokenGraduated(address(this), pairAddress, usdtAmount, tokenAmount, block.timestamp);
    }
} 