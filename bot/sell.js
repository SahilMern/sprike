const dotenv = require("dotenv").config({});
const axios = require("axios");
const { ethers } = require("ethers");
const {
  pairAddress,
  routerAddress,
  tokenAddress,
  pairedTokenAddress,
} = require("./Address");
const { UNISWAP_PAIR_ABI, UNISWAP_ROUTER_ABI } = require("./Abis");
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet(process.env.private_key, provider);

let botStatus = require("../bot/BotStatus");

//! BITMART PRICE
async function fetchDynamicPrice() {
  try {
    const response = await axios.get(
      "https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=DEOD_USDT"
    );
    if (response.status === 200) {
      const bestBidPrice = response.data.data.best_bid;
      // console.log("Best Bid Price from Bitmart:", bestBidPrice);
      return parseFloat(bestBidPrice);
    } else {
      console.error("Error: Could not fetch data from Bitmart");
      return null;
    }
  } catch (error) {
    console.error("Error fetching Bitmart data:", error);
    return null;
  }
}

//! UNISWAP BOT PRICE DETAILS
// Fetch reserves from Uniswap Pair Contract
async function fetchReserves() {
  const pairContract = new ethers.Contract(
    pairAddress,
    UNISWAP_PAIR_ABI,
    provider
  );
  const [reserve0, reserve1] = await pairContract.getReserves();
  return { reserve0, reserve1 };
}

//!How Much To Sell
async function calculateTokensToSell(bitmartPrice, deskPrice, reserve1BigInt1) {
  const amountToSell =
    (reserve1BigInt1 * (deskPrice - bitmartPrice)) / deskPrice;
  return ethers.parseEther(amountToSell.toString());
}

async function sellTokens(amountToSell) {
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

    const approveTx = await tokenContract.approve(routerAddress, amountToSell);
    await approveTx.wait();
    console.log("Token approved for transfer to Uniswap Router");

    const path = [tokenAddress, pairedTokenAddress];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 
    const amountOutMin = 0;

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
}

const fetchDeskPrice = async () => {
  const { reserve0, reserve1 } = await fetchReserves();
  
  const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6);
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18);
  const deskPrice = reserve0BigInt / reserve1BigInt;
  
  // console.log("Reserves:", reserve0, reserve1);
  // console.log("Reserves (BigInt):", reserve0BigInt, reserve1BigInt);
  // console.log("Current Uniswap Price:", currentPrice, dynamicPrice);

  return { deskPrice, reserve1BigInt };
};

const sellCode = async () => {
  while (botStatus.status) {
    try {
      const bitmartPrice = await fetchDynamicPrice();
      const { deskPrice, reserve1BigInt } = await fetchDeskPrice();
      console.log(`bitmartPrice:-${bitmartPrice} And deskPrice ${deskPrice} `);
      

      const priceDifference = ((deskPrice - bitmartPrice) / bitmartPrice) * 100;
      if (Math.abs(priceDifference) > 3) {
        const amountToSell = await calculateTokensToSell(
          bitmartPrice,
          deskPrice,
          reserve1BigInt
        );
        await sellTokens(amountToSell);
      } else {
        console.log(`Differnce is Less then 3% and value is  ${Math.abs(priceDifference)}%`);
      }

      // }
      await new Promise((resolve) => setTimeout(resolve, 4000));
      console.log("---------Complete Tranction-----------------");
    } catch (error) {
      console.log(error, "Errror In main");
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  }
};

module.exports = sellCode;
