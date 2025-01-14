const axios = require("axios");
const { ethers } = require("ethers");

// Uniswap Pair Contract ABI (simplified)
const UNISWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

// Token addresses (replace with actual addresses)
const tokenAddress = "0xe77abb1e75d2913b2076dd16049992ffeaca5235";
const pairedTokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // e.g., WETH or USDC
const pairAddress = "0xfF8a4bF12340B99aF260bb0bA57B84eA57BE390D"; // Replace with actual pair address
const routerAddress = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // Uniswap Router Contract address
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

// Wallet initialization (replace with your private key)
const wallet = new ethers.Wallet(
  "",
  provider
);

// Uniswap Router ABI (simplified for trade)
const UNISWAP_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

async function fetchParaswapPrice() {
  try {
    const url =
      "https://api.paraswap.io/prices/?srcToken=0xE77aBB1E75D2913B2076DD16049992FFeACa5235&destToken=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&network=137&partner=quickswapv3&includeDEXS=quickswap%2Cquickswapv3%2Cquickswapv3.1%2Cquickperps&srcDecimals=18&destDecimals=6&amount=1000000000000000000&side=SELL&maxImpact=15";
    const response = await axios.get(url);
    const price = response.data.priceRoute.destUSD;
    return price;
  } catch (error) {
    console.error("Error fetching Paraswap data:", error);
  }
}

async function fetchReserves() {
  const pairContract = new ethers.Contract(
    pairAddress,
    UNISWAP_PAIR_ABI,
    provider
  );
  const [reserve0, reserve1] = await pairContract.getReserves();
  //   return { reserve0, reserve1 };
//   console.log("Reserves:", reserve0, reserve1);
  const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6); // Reserve of token0 (your token)
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18);
//   console.log("Reserves (BigInt):", reserve0BigInt, reserve1BigInt);

  const currentPrice = reserve0BigInt / reserve1BigInt;
  console.log("Current Uniswap Price:", currentPrice);
}

// Use an async function to handle the asynchronous calls
async function main() {
  try {
    const paraswapPrice = await fetchParaswapPrice();
    const reserves = await fetchReserves();

    console.log("Paraswap Price:", paraswapPrice);
    // console.log("Uniswap Reserves:", reserves);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
