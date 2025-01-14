const axios = require("axios");
const { ethers } = require("ethers");
const { pairAddress, routerAddress, tokenAddress } = require("./Address");
const { UNISWAP_PAIR_ABI, UNISWAP_ROUTER_ABI } = require("./Abis");
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet(
  "b4bce5986e48bcad74828334830d43bd4e6ae6fb5b39d6f19ea72d8ca197dd5a",
  provider
);

let botStatus = require("../bot/BotStatus");
// console.log(botStatus, "botStatus");

//!BITMART PRICE
async function fetchDynamicPrice() {
  try {
    const response = await axios.get(
      "https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=DEOD_USDT"
    );
    if (response.status === 200) {
      const bestBidPrice = response.data.data.best_bid;
      console.log("Best Bid Price from Bitmart:", bestBidPrice);
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

//!UNISWAP BOT PRICE DETAILS
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
  console.log(
    bitmartPrice,
    deskPrice,
    reserve1BigInt1,
    "bitmartPrice, deskPrice,reserve1BigInt"
  );

  // const reserve1BigInt = ethers.formatUnits(reserve1BigInt1.toString(), 18);
  const amountToSell =
    (reserve1BigInt1 * (deskPrice - bitmartPrice)) / deskPrice;

  return ethers.parseEther(amountToSell.toString());
  // return ethers.parseEther(amountToSell.toString());
}

async function sellTokens(amountToSell) {
  if (amountToSell > 0) {
    // Approve token transfer to Uniswap Router (if not already approved)
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

    console.log("Sellling mai aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    return true;

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

const fetchDeskPrice = async () => {
  const { reserve0, reserve1 } = await fetchReserves();
  console.log("Reserves:", reserve0, reserve1);

  const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6); // Reserve of token0 (your token)
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18);
  console.log("Reserves (BigInt):", reserve0BigInt, reserve1BigInt);

  const deskPrice = reserve0BigInt / reserve1BigInt;
  // console.log("Current Uniswap Price:", currentPrice, dynamicPrice);

  console.log(deskPrice, "Current Price");
  return { deskPrice, reserve1BigInt };
};

const sellCode = async () => {
  try {
    while (botStatus.status) {
      const bitmartPrice = await fetchDynamicPrice();
      const { deskPrice, reserve1BigInt } = await fetchDeskPrice();

      console.log(bitmartPrice, deskPrice, reserve1BigInt, "Both price");

      const priceDifference = ((deskPrice - bitmartPrice) / bitmartPrice) * 100;
      console.log(priceDifference, "priceDifference");

      if (Math.abs(priceDifference) > 0.1) {
        console.log("Differnce is More than 3%");

        const amountToSell = await calculateTokensToSell(
          bitmartPrice,
          deskPrice,
          reserve1BigInt
        );
        console.log(amountToSell, "Amiou6sell");
      } else {
        console.log("Differnce is Less then  3%");
      }
      // return true;

      // process.exit()
      // console.log(dynamicPrice, "dynamicPrice");

      // if (dynamicPrice !== null) {
      //   const amountToSell = await calculateTokensToSell(dynamicPrice);
      //   console.log(amountToSell, "amountTosell");
      //   await sellTokens(amountToSell);
      // }
      await new Promise((resolve) => setTimeout(resolve, 8000));
      console.log("-----------");
    }
  } catch (error) {
    console.log(error, "Errror In main");
  }
};

module.exports = sellCode;
