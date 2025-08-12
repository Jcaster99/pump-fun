// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenFactory.sol";

/**
 * @title GravityScoreSystem
 * @dev System obliczania i przechowywania Gravity Score
 */
contract GravityScoreSystem is Ownable {
    // Adres fabryki tokenów
    address public tokenFactory;
    
    // Mapowanie adresów tokenów do ich Gravity Score
    mapping(address => uint256) public tokenScores;
    
    // Mapowanie adresów tokenów do timestampów ostatniej aktualizacji
    mapping(address => uint256) public lastScoreUpdate;
    
    // Zdarzenia
    event ScoreUpdated(address indexed tokenAddress, uint256 newScore, uint256 timestamp);
    
    /**
     * @dev Konstruktor ustawiający właściciela
     */
    constructor() Ownable() {}
    
    /**
     * @dev Ustawia adres fabryki tokenów
     * @param _tokenFactory Adres fabryki
     */
    function setTokenFactory(address _tokenFactory) external onlyOwner {
        tokenFactory = _tokenFactory;
    }
    
    /**
     * @dev Aktualizuje Gravity Score dla tokenu
     * @param _tokenAddress Adres tokenu
     * @param _newScore Nowy Gravity Score
     */
    function updateScore(address _tokenAddress, uint256 _newScore) external onlyOwner {
        require(_newScore <= 1000, "Gravity Score cannot exceed 1000");
        
        tokenScores[_tokenAddress] = _newScore;
        lastScoreUpdate[_tokenAddress] = block.timestamp;
        
        // Aktualizuj score w fabryce tokenów
        TokenFactory(tokenFactory).updateGravityScore(_tokenAddress, _newScore);
        
        emit ScoreUpdated(_tokenAddress, _newScore, block.timestamp);
    }
    
    /**
     * @dev Aktualizuje Gravity Score dla wielu tokenów naraz
     * @param _tokenAddresses Tablica adresów tokenów
     * @param _newScores Tablica nowych Gravity Score
     */
    function batchUpdateScores(address[] calldata _tokenAddresses, uint256[] calldata _newScores) external onlyOwner {
        require(_tokenAddresses.length == _newScores.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            require(_newScores[i] <= 1000, "Gravity Score cannot exceed 1000");
            
            tokenScores[_tokenAddresses[i]] = _newScores[i];
            lastScoreUpdate[_tokenAddresses[i]] = block.timestamp;
            
            // Aktualizuj score w fabryce tokenów
            TokenFactory(tokenFactory).updateGravityScore(_tokenAddresses[i], _newScores[i]);
            
            emit ScoreUpdated(_tokenAddresses[i], _newScores[i], block.timestamp);
        }
    }
    
    /**
     * @dev Pobiera Gravity Score dla tokenu
     * @param _tokenAddress Adres tokenu
     * @return Gravity Score
     */
    function getScore(address _tokenAddress) external view returns (uint256) {
        return tokenScores[_tokenAddress];
    }
    
    /**
     * @dev Pobiera timestamp ostatniej aktualizacji Gravity Score dla tokenu
     * @param _tokenAddress Adres tokenu
     * @return Timestamp ostatniej aktualizacji
     */
    function getLastUpdateTime(address _tokenAddress) external view returns (uint256) {
        return lastScoreUpdate[_tokenAddress];
    }
} 