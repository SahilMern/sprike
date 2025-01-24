const dotenv = require("dotenv").config({});
const axios = require("axios");
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet(process.env.private_key, provider);

const tokenAddress = "0xe77abb1e75d2913b2076dd16049992ffeaca5235";
const pairedTokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const pairAddress = "0xfF8a4bF12340B99aF260bb0bA57B84eA57BE390D";
const routerAddress = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";

const UNISWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const UNISWAP_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

async function sellTokens(amountToSell) {
  console.log(amountToSell, "sell deod");
  try {
    if (amountToSell > 0) {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        wallet
      );
      const routerContract = new ethers.Contract(
        routerAddress,
        UNISWAP_ROUTER_ABI,
        wallet
      );

      console.log("Inside Selling");

      // Approve token for spending by Uniswap Router
      const approveTx = await tokenContract.approve(routerAddress, amountToSell);
      await approveTx.wait();
      console.log("Token approved for transfer to Uniswap Router");

      // Prepare path for token swap
      const path = [tokenAddress, pairedTokenAddress];

      // Set a deadline for the transaction (20 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Here, you should set amountOutMin to a reasonable value to avoid slippage risks
      const amountOutMin = 0; // You can change this to some other slippage value if needed

      // Execute the swap on Uniswap
      const swapTx = await routerContract.swapExactTokensForTokens(
        amountToSell,
        amountOutMin,
        path,
        wallet.address,
        deadline
      );

      await swapTx.wait();
      console.log("Tokens sold successfully on Uniswap!");
    } else {
      console.log("No tokens to sell.");
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

// Convert amount to sell (in token units, not ether units)
let amountToSell = 10;  // Adjust this amount based on your token's decimals
const data = ethers.parseUnits(amountToSell.toString(), 18);  // Assuming token has 18 decimals
sellTokens(data);
