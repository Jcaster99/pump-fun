// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BondingCurveToken.sol";

// Interface declarations to avoid circular dependencies
interface ILF0GSwapFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface ILF0GSwapPair {
    function initialize(uint tokenAmount, uint usdtAmount) external;
}

interface IGraduationRegistry {
    function registerToken(address token, address pair) external;
}

/**
 * @title TokenFactory
 * @dev Fabryka do tworzenia tokenów z bonding curve
 */
contract TokenFactory is Ownable {
    using SafeERC20 for IERC20;
    
    // Lista utworzonych tokenów
    address[] public createdTokens;
    
    // Mapowanie twórcy do jego tokenów
    mapping(address => address[]) public creatorTokens;
    
    // Mapping adresu tokenu do jego danych
    mapping(address => TokenData) public tokenData;
    
    // Adres systemu Gravity Score
    address public gravityScoreSystem;
    
    // Adres USDT
    address public immutable USDT;
    
    // Skarbiec na opłaty
    address public treasury;
    
    // Addresses of the SwapFactory and GraduationRegistry (set once by owner)
    address public swapFactory;
    address public graduationRegistry;
    
    // Graduation tracking
    mapping(address => bool) public isTokenGraduated;
    mapping(address => address) public tokenToPair;
    address[] public graduatedTokens;
    
    // Event emitted when a token graduates
    event TokenGraduated(address indexed token, address indexed pair);
    
    // Struktura danych tokenu
    struct TokenData {
        string name;
        string symbol;
        string description;
        address creator;
        uint256 creationTime;
        uint256 gravityScore;
    }
    
    // Zdarzenia
    event TokenCreated(address indexed tokenAddress, string name, string symbol, address indexed creator);
    
    /**
     * @dev Konstruktor z adresem skarbca
     * @param _treasury Adres skarbca
     * @param _gravityScoreSystem Adres systemu Gravity Score
     * @param _usdt Adres kontraktu USDT
     */
    constructor(address _treasury, address _gravityScoreSystem, address _usdt) Ownable() {
        treasury = _treasury;
        gravityScoreSystem = _gravityScoreSystem;
        USDT = _usdt;
    }
    
    /**
     * @dev Tworzy nowy token
     * @param _name Nazwa tokenu
     * @param _symbol Symbol tokenu
     * @param _description Opis tokenu
     */
    function createToken(
        string memory _name,
        string memory _symbol,
        string memory _description
    ) external {
        // Tworzymy nowy token
        BondingCurveToken newToken = new BondingCurveToken(
            _name,
            _symbol,
            _description,
            msg.sender,
            treasury,
            USDT
        );
        
        // Zapisujemy adres tokenu
        address tokenAddress = address(newToken);
        createdTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        // Zapisujemy dane tokenu
        tokenData[tokenAddress] = TokenData({
            name: _name,
            symbol: _symbol,
            description: _description,
            creator: msg.sender,
            creationTime: block.timestamp,
            gravityScore: 0
        });
        
        emit TokenCreated(tokenAddress, _name, _symbol, msg.sender);
    }
    
    /**
     * @dev Aktualizuje Gravity Score dla tokenu
     * @param _tokenAddress Adres tokenu
     * @param _newScore Nowy Gravity Score
     */
    function updateGravityScore(address _tokenAddress, uint256 _newScore) external {
        require(msg.sender == gravityScoreSystem || msg.sender == owner(), "Not authorized");
        
        // Aktualizuj score w danych tokenu
        tokenData[_tokenAddress].gravityScore = _newScore;
        
        // Aktualizuj score w kontrakcie tokenu
        BondingCurveToken(_tokenAddress).updateGravityScore(_newScore);
    }
    
    /**
     * @dev Pobiera tokeny utworzone przez określonego twórcę
     * @param _creator Adres twórcy
     * @return Lista adresów tokenów
     */
    function getCreatorTokens(address _creator) external view returns (address[] memory) {
        return creatorTokens[_creator];
    }
    
    /**
     * @dev Pobiera wszystkie utworzone tokeny
     * @return Lista adresów tokenów
     */
    function getAllTokens() external view returns (address[] memory) {
        return createdTokens;
    }
    
    /**
     * @dev Aktualizuje adres skarbca
     * @param _newTreasury Nowy adres skarbca
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }
    
    /**
     * @dev Aktualizuje adres systemu Gravity Score
     * @param _newSystem Nowy adres systemu
     */
    function updateGravityScoreSystem(address _newSystem) external onlyOwner {
        gravityScoreSystem = _newSystem;
    }
    
    /**
     * @dev Sets addresses for SwapFactory and GraduationRegistry. Callable only once per variable.
     */
    function setGraduationAddresses(address _swapFactory, address _graduationRegistry) external onlyOwner {
        require(_swapFactory != address(0) && _graduationRegistry != address(0), "Zero address");
        swapFactory = _swapFactory;
        graduationRegistry = _graduationRegistry;
    }
    
    /**
     * @dev Finalises token graduation. Must be called by the token contract itself after it approved allowances.
     * Transfers liquidity to the newly-created pair, initialises it and registers the graduation.
     * @return pair Address of the newly created liquidity pair.
     */
    function graduateToken(address token, uint256 usdtAmount, uint256 tokenAmount) external returns (address pair) {
        require(msg.sender == token, "Caller must be token");
        require(!isTokenGraduated[token], "Token already graduated");
        require(swapFactory != address(0), "SwapFactory not set");

        // 1. Create pair (token, USDT)
        pair = ILF0GSwapFactory(swapFactory).createPair(token, USDT);

        // 2. Pull liquidity from token contract to pair
        // USDT będzie przesłany bezpośrednio przez kontrakt tokenu (zamiast transferFrom)
        IERC20(token).safeTransferFrom(token, pair, tokenAmount);

        // 3. Initialise pair reserves (jeśli brak USDT to ustaw 1 wei aby uniknąć /0)
        uint256 initUsdt = usdtAmount == 0 ? 1 : usdtAmount;
        ILF0GSwapPair(pair).initialize(tokenAmount, initUsdt);

        // 4. Update mappings
        isTokenGraduated[token] = true;
        tokenToPair[token] = pair;
        graduatedTokens.push(token);

        // 5. Register in external registry (optional)
        if (graduationRegistry != address(0)) {
            IGraduationRegistry(graduationRegistry).registerToken(token, pair);
        }

        emit TokenGraduated(token, pair);
    }
    
    /**
     * @dev Returns list of graduated tokens.
     */
    function getGraduatedTokens() external view returns (address[] memory) {
        return graduatedTokens;
    }
    
    /**
     * @dev Returns swap pair for given token.
     */
    function getSwapPair(address token) external view returns (address) {
        return tokenToPair[token];
    }
    
    /**
     * @dev Allows a token creator to claim their unlocked tokens through the factory.
     * This is useful when the front-end interacts tylko with the factory contract. The factory
     * verifies that the caller is the owner (creator) of the given token, then forwards the
     * claim call. Inside the token, the modified `claimByFactory()` now accepts calls
     * originating from the factory.
     *
     * Requirements:
     * - Caller must be the `owner()` of the token (creator) or be registered as a creator in creatorTokens mapping.
     * - The token must have unlocked tokens available.
     */
    function claimCreatorTokens(address tokenAddress) external {
        BondingCurveToken token = BondingCurveToken(tokenAddress);

        // Sprawdź, czy wywołujący jest właścicielem tokenu LUB jest twórcą w mapowaniu
        bool isOwner = token.owner() == msg.sender;
        bool isCreator = isTokenCreator(msg.sender, tokenAddress);
        
        require(isOwner || isCreator, "Caller is not token owner or creator");

        // Wywołaj claimByFactory – token zresetuje licznik i wyśle je bezpośrednio do właściciela
        token.claimByFactory(msg.sender);
    }
    
    /**
     * @dev Sprawdza, czy podany adres jest twórcą tokenu według zapisów w kontrakcie
     * @param potentialCreator Adres do sprawdzenia
     * @param tokenAddress Adres tokenu
     * @return true jeśli podany adres jest twórcą tokenu
     */
    function isTokenCreator(address potentialCreator, address tokenAddress) public view returns (bool) {
        // Sprawdź dane w tokenData
        if (tokenData[tokenAddress].creator == potentialCreator) return true;
        
        // Sprawdź w mapowaniu creatorTokens
        address[] memory tokens = creatorTokens[potentialCreator];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenAddress) return true;
        }
        
        return false;
    }
} 