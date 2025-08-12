// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGraduationRegistry {
    function registerToken(address token, address pair) external;
    function isGraduated(address token) external view returns (bool);
    function getTokenPair(address token) external view returns (address);
    function getGraduatedTokens() external view returns (address[] memory);
}

contract GraduationRegistry is IGraduationRegistry, Ownable {
    // Mapping token -> graduated status
    mapping(address => bool) private _isGraduated;
    // Mapping token -> pair address
    mapping(address => address) private _tokenToPair;
    // Array of graduated tokens for enumeration
    address[] private _graduatedTokens;

    // Authorised registrars (e.g., TokenFactory)
    mapping(address => bool) public authorisedRegistrars;

    event TokenRegistered(address indexed token, address indexed pair);
    event RegistrarStatusChanged(address indexed registrar, bool authorised);

    modifier onlyAuthorised() {
        require(authorisedRegistrars[msg.sender] || msg.sender == owner(), "Not authorised");
        _;
    }

    function addRegistrar(address registrar) external onlyOwner {
        authorisedRegistrars[registrar] = true;
        emit RegistrarStatusChanged(registrar, true);
    }

    function removeRegistrar(address registrar) external onlyOwner {
        authorisedRegistrars[registrar] = false;
        emit RegistrarStatusChanged(registrar, false);
    }

    // IGraduationRegistry implementation
    function registerToken(address token, address pair) external override onlyAuthorised {
        require(!_isGraduated[token], "Already registered");
        require(token != address(0) && pair != address(0), "Zero address");

        _isGraduated[token] = true;
        _tokenToPair[token] = pair;
        _graduatedTokens.push(token);

        emit TokenRegistered(token, pair);
    }

    function isGraduated(address token) external view override returns (bool) {
        return _isGraduated[token];
    }

    function getTokenPair(address token) external view override returns (address) {
        return _tokenToPair[token];
    }

    function getGraduatedTokens() external view override returns (address[] memory) {
        return _graduatedTokens;
    }
} 