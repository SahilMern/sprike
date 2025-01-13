const axios = require('axios');
const { ethers } = require('ethers');
const { pairAddress } = require('./Address');
const { UNISWAP_PAIR_ABI } = require('./Abis');
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet("b4bce5986e48bcad74828334830d43bd4e6ae6fb5b39d6f19ea72d8ca197dd5a", provider);

let botStatus = require("../bot/BotStatus")
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
  const pairContract = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, provider);
  const [reserve0, reserve1] = await pairContract.getReserves();
  return { reserve0, reserve1 };
}

//!How Much To Sell
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



const sellCode = async() => {
    try {
       while (botStatus.status) {
         const dynamicPrice = await fetchDynamicPrice();
         console.log(dynamicPrice, "dynamicPrice");
         
         if (dynamicPrice !== null) {
           const amountToSell = await calculateTokensToSell(dynamicPrice);
           console.log(amountToSell, "amountTosell");
           
        //    process.exit()
         //   await sellTokens(amountToSell);
           console.log("heyeyeyueyey");
           
         }

        await new Promise(resolve => setTimeout(resolve, 8000));
         console.log("---------------------------------");
         
       }
      } catch (error) {
        console.log(error, "Errror In main");
      }
}

module.exports= sellCode;