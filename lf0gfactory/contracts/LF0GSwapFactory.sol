// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LF0GSwapPair.sol";

contract LF0GSwapFactory is Ownable {
    // Mapping from tokenA->tokenB to pair
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint indexed pairIndex);

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    /**
     * @dev Creates a pair for tokenA & tokenB. Reverts if it already exists.
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "LF0G: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "LF0G: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "LF0G: PAIR_EXISTS");

        bytes memory bytecode = type(LF0GSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        LF0GSwapPair(pair).setup(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length - 1);
    }
} 