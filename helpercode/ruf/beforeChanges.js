const axios = require("axios");
const { ethers } = require("ethers");
const { pairAddress, routerAddress, tokenAddress } = require("./Address");
const { UNISWAP_PAIR_ABI, UNISWAP_ROUTER_ABI } = require("./Abis");
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet(
  "b4bce5986e48bcad74828334830d43bd4e6ae6fb5b39d6f19ea72d8ca197dd5a",
  provider
);

let botStatus = require("../../bot/BotStatus");
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
async function calculateTokensToSell(dynamicPrice) {
  const { reserve0, reserve1 } = await fetchReserves();
  console.log("Reserves:", reserve0, reserve1);
  const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6); 
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18);
  console.log("Reserves (BigInt):", reserve0BigInt, reserve1BigInt);

  const currentPrice = reserve0BigInt / reserve1BigInt;
  console.log("Current Uniswap Price:", currentPrice, dynamicPrice);

  const priceDifference = ((currentPrice - dynamicPrice) / dynamicPrice) * 100;
  console.log(priceDifference, "priceDifference");

  if (Math.abs(priceDifference) > 0.01) {
    const amountToSell =
      (reserve1BigInt * (currentPrice - dynamicPrice)) / currentPrice; // Simple proportional formula
    console.log(ethers.parseEther(amountToSell.toString()), "hucwuwfejefjnfnfnfnnfnfnfnfnnfnfnfnfnfnfnfnfnfnfnfnfnfnfnfn");
    return ethers.parseEther(amountToSell.toString());
    // return ethers.parseEther(amountToSell.toString());
  } else {
    console.log("No need to sell. Current price is below dynamic price.");
    return 0;
  }
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

const sellCode = async () => {
  try {
    while (botStatus.status) {
      const dynamicPrice = await fetchDynamicPrice();

      if (dynamicPrice !== null) {
        const amountToSell = await calculateTokensToSell(dynamicPrice);
        console.log(amountToSell, "amountTosell");
        // await sellTokens(amountToSell);
      }

      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  } catch (error) {
    console.log(error, "Errror In main");
  }
};

sellCode();
// module.exports = sellCode;
