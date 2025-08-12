// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract LF0GSwapPair is ERC20 {
    using SafeERC20 for IERC20;

    address public token0;
    address public token1;
    address public factory;

    uint112 private reserve0; // token0 reserve
    uint112 private reserve1; // token1 reserve
    uint32  private blockTimestampLast;

    bool public initialised;

    modifier onlyFactory() {
        require(msg.sender == factory, "LF0G: FORBIDDEN");
        _;
    }

    constructor() ERC20("LF0G LP", "LF0G-LP") {
        factory = msg.sender;
    }

    function setup(address _token0, address _token1) external onlyFactory {
        require(!initialised, "Already setup");
        token0 = _token0;
        token1 = _token1;
        initialised = true;
    }

    // Called once by TokenFactory after liquidity is transferred
    function initialize(uint tokenAmount, uint usdtAmount) external {
        _update(uint112(tokenAmount), uint112(usdtAmount));
        // Mint LP tokens to burn address (0xdead) making liquidity permanent
        _mint(address(0xdead), Math.sqrt(tokenAmount * usdtAmount));
    }

    function _update(uint112 _reserve0, uint112 _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = uint32(block.timestamp);
    }

    // Basic swap (X * Y = K, no fees, simple demo). Assumes token0 is the custom token, token1 is USDT.
    function swap(uint amount0Out, uint amount1Out, address to) external {
        require(amount0Out > 0 || amount1Out > 0, "LF0G: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "LF0G: INSUFFICIENT_LIQUIDITY");

        if (amount0Out > 0) IERC20(token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).safeTransfer(to, amount1Out);

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0In = balance0 > (_reserve0 - amount0Out) ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > (_reserve1 - amount1Out) ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "LF0G: INSUFFICIENT_INPUT");

        // Simple invariant check without fees
        require(balance0 * balance1 >= uint(_reserve0) * uint(_reserve1), "LF0G: K");

        _update(uint112(balance0), uint112(balance1));
    }

    function getReserves() public view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    /**
     * @dev Executes a swap of exact tokens for tokens in one transaction.
     * This combines the transfer and swap operations, simplifying the UX.
     * @param amountIn The exact amount of input tokens to send
     * @param amountOutMin The minimum amount of output tokens to receive
     * @param isToken0 Whether the input token is token0 (true) or token1 (false)
     * @param to The recipient address to receive the output tokens
     * @return amountOut The actual amount of output tokens received
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        bool isToken0,
        address to
    ) external returns (uint amountOut) {
        require(amountIn > 0, "LF0G: INSUFFICIENT_INPUT_AMOUNT");
        
        // Get current reserves
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        // Determine which token is input/output based on isToken0
        uint reserveIn = isToken0 ? _reserve0 : _reserve1;
        uint reserveOut = isToken0 ? _reserve1 : _reserve0;
        address tokenIn = isToken0 ? token0 : token1;
        address tokenOut = isToken0 ? token1 : token0;
        
        // Calculate output amount using x*y=k formula
        // amountOut = (reserveOut * amountIn) / (reserveIn + amountIn)
        amountOut = (reserveOut * amountIn) / (reserveIn + amountIn);
        require(amountOut >= amountOutMin, "LF0G: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Transfer input tokens from sender to pair
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to recipient
        IERC20(tokenOut).safeTransfer(to, amountOut);
        
        // Update reserves
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        
        // Verify k after swap
        require(balance0 * balance1 >= uint(_reserve0) * uint(_reserve1), "LF0G: K");
        
        // Update internal reserves
        _update(uint112(balance0), uint112(balance1));
        
        return amountOut;
    }

    /**
     * @dev Calculates the output amount for a given input amount based on reserves
     * @param amountIn The input amount 
     * @param isToken0In Whether the input token is token0 (true) or token1 (false)
     * @return Amount of output tokens that would be received
     */
    function getAmountOut(uint amountIn, bool isToken0In) public view returns (uint) {
        require(amountIn > 0, "LF0G: INSUFFICIENT_INPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        uint reserveIn = isToken0In ? _reserve0 : _reserve1;
        uint reserveOut = isToken0In ? _reserve1 : _reserve0;
        
        return (reserveOut * amountIn) / (reserveIn + amountIn);
    }

    /**
     * @dev Calculates the input amount needed for a given output amount based on reserves
     * @param amountOut The desired output amount 
     * @param isToken0In Whether the input token is token0 (true) or token1 (false)
     * @return Amount of input tokens that would be required
     */
    function getAmountIn(uint amountOut, bool isToken0In) public view returns (uint) {
        require(amountOut > 0, "LF0G: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        uint reserveIn = isToken0In ? _reserve0 : _reserve1;
        uint reserveOut = isToken0In ? _reserve1 : _reserve0;
        
        require(amountOut < reserveOut, "LF0G: INSUFFICIENT_LIQUIDITY");
        
        // amountIn = (reserveIn * amountOut) / (reserveOut - amountOut)
        return (reserveIn * amountOut) / (reserveOut - amountOut);
    }

    /**
     * @dev Provides a price quote for the given amount and reserves
     * @param amountIn The input amount
     * @param reserveIn The reserve of the input token
     * @param reserveOut The reserve of the output token
     * @return Amount of output tokens for the given input and reserves
     */
    function quote(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint) {
        require(amountIn > 0, "LF0G: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "LF0G: INSUFFICIENT_LIQUIDITY");
        
        return (amountIn * reserveOut) / reserveIn;
    }

    /**
     * @dev Executes a swap to get exact tokens for input tokens.
     * This function allows specifying the exact amount of output tokens desired.
     * @param amountOut The exact amount of output tokens to receive
     * @param amountInMax The maximum amount of input tokens willing to spend
     * @param isToken0 Whether the input token is token0 (true) or token1 (false)
     * @param to The recipient address to receive the output tokens
     * @return amountIn The actual amount of input tokens spent
     */
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        bool isToken0,
        address to
    ) external returns (uint amountIn) {
        require(amountOut > 0, "LF0G: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Get current reserves
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        // Determine which token is input/output based on isToken0
        uint reserveIn = isToken0 ? _reserve0 : _reserve1;
        uint reserveOut = isToken0 ? _reserve1 : _reserve0;
        address tokenIn = isToken0 ? token0 : token1;
        address tokenOut = isToken0 ? token1 : token0;
        
        // Ensure output amount is available
        require(amountOut < reserveOut, "LF0G: INSUFFICIENT_LIQUIDITY");
        
        // Calculate input amount required using x*y=k formula
        // amountIn = (reserveIn * amountOut) / (reserveOut - amountOut)
        amountIn = (reserveIn * amountOut) / (reserveOut - amountOut);
        require(amountIn <= amountInMax, "LF0G: EXCESSIVE_INPUT_AMOUNT");
        
        // Transfer input tokens from sender to pair
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to recipient
        IERC20(tokenOut).safeTransfer(to, amountOut);
        
        // Update reserves
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        
        // Verify k after swap
        require(balance0 * balance1 >= uint(_reserve0) * uint(_reserve1), "LF0G: K");
        
        // Update internal reserves
        _update(uint112(balance0), uint112(balance1));
        
        return amountIn;
    }

    /**
     * @dev Force updates the stored reserves to match the actual balances in the pair.
     *      This is helpful when liquidity is transferred directly (outside of swap/add routines),
     *      e.g. during the graduation procedure.
     */
    function sync() external {
        uint112 balance0 = uint112(IERC20(token0).balanceOf(address(this)));
        uint112 balance1 = uint112(IERC20(token1).balanceOf(address(this)));
        _update(balance0, balance1);
    }
} 