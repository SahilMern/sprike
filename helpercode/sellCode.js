const axios = require('axios');
const { ethers } = require('ethers');

// Uniswap Pair Contract ABI (simplified)
const UNISWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// Token addresses (replace with actual addresses)
const tokenAddress = "0xe77abb1e75d2913b2076dd16049992ffeaca5235";
const pairedTokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // e.g., WETH or USDC
const pairAddress = "0xfF8a4bF12340B99aF260bb0bA57B84eA57BE390D"; // Replace with actual pair address
const routerAddress = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // Uniswap Router Contract address
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

// Wallet initialization (replace with your private key)
const wallet = new ethers.Wallet("", provider);

// Uniswap Router ABI (simplified for trade)
const UNISWAP_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

// Fetch dynamic price from Bitmart API
async function fetchDynamicPrice() {
  try {
    // Send a GET request to the Bitmart API
    const response = await axios.get(
      "https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=DEOD_USDT"
    );
    
    // Check if the response is successful
    if (response.status === 200) {
      const bestBidPrice = response.data.data.best_bid;
      console.log("Best Bid Price from Bitmart:", bestBidPrice);
      return parseFloat(bestBidPrice); // Return the best bid price as a number
    } else {
      console.error("Error: Could not fetch data from Bitmart");
      return null; // Return null if fetching the data fails
    }
  } catch (error) {
    // Catch any errors (network issues, invalid response, etc.)
    console.error("Error fetching Bitmart data:", error);
    return null;
  }
}

// Fetch reserves from Uniswap Pair Contract
async function fetchReserves() {
  const pairContract = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, provider);
  const [reserve0, reserve1] = await pairContract.getReserves();
  return { reserve0, reserve1 };
}

// Calculate the amount of tokens to sell
async function calculateTokensToSell(dynamicPrice) {
  const { reserve0, reserve1 } = await fetchReserves();
  console.log("Reserves:", reserve0, reserve1);
  const reserve0BigInt = ethers.formatUnits(reserve0.toString(),6); // Reserve of token0 (your token)
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(),18);
  console.log("Reserves (BigInt):", reserve0BigInt, reserve1BigInt);
  
  
  const currentPrice = reserve0BigInt  / reserve1BigInt; 
  console.log("Current Uniswap Price:", currentPrice);

  if (currentPrice > dynamicPrice) {
    // Calculate how many tokens to sell
    const amountToSell = (reserve1BigInt * (currentPrice - dynamicPrice)) / currentPrice; // Simple proportional formula
    console.log("Amount to sell:", amountToSell);
    return ethers.parseEther(amountToSell.toString());
    // return ethers.parseEther(amountToSell.toString());
  } else {
    console.log("No need to sell. Current price is below dynamic price.");
    return 0;
  }
}

// Function to execute token sale on Uniswap
async function sellTokens(amountToSell) {
  if (amountToSell > 0) {
    // Approve token transfer to Uniswap Router (if not already approved)
    const tokenContract = new ethers.Contract(tokenAddress, ["function approve(address spender, uint256 amount) public returns (bool)"], wallet);
    const routerContract = new ethers.Contract(routerAddress, UNISWAP_ROUTER_ABI, wallet);
    
    // Approve Uniswap Router to spend tokens
    const approveTx = await tokenContract.approve(routerAddress, amountToSell);
    await approveTx.wait();
    console.log("Token approved for transfer to Uniswap Router");

    // Path for token swap (your token -> paired token, e.g., DEOD -> WETH)
    const path = [tokenAddress, pairedTokenAddress];

    // Swap tokens on Uniswap (adjust slippage tolerance as needed)
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    const amountOutMin = 0; // Adjust this based on slippage tolerance

    const swapTx = await routerContract.swapExactTokensForTokens(
      amountToSell,
      amountOutMin,
      path,
      wallet.address, // Recipient address (your wallet)
      deadline
    );

    await swapTx.wait();
    console.log("Tokens sold successfully on Uniswap!");
  } else {
    console.log("No tokens to sell.");
  }
}

const sellCode = async () => {
  try {
    const dynamicPrice = await fetchDynamicPrice();
    if (dynamicPrice !== null) {
      const amountToSell = await calculateTokensToSell(dynamicPrice);
      await sellTokens(amountToSell);
      console.log("heyeyeyueyey");
      
    }
  } catch (error) {
    console.log(error, "Errror In main");
  }
};

module.exports = sellCode;
