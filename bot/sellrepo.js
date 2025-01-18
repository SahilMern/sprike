const dotenv = require("dotenv").config({});
const axios = require("axios");
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const wallet = new ethers.Wallet(
  "",
  provider
);

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
  const priceThreshold = bitmartPrice * 1.03;
  console.log(
    bitmartPrice,
    deskPrice,
    priceThreshold,
    "pricethreshold --p-------"
  );

  if (deskPrice > priceThreshold) {
    const amountToSell =
      (reserve1BigInt1 * (deskPrice - bitmartPrice)) / deskPrice;
    return ethers.parseEther(amountToSell.toString());
  }else{
    console.log("No need to sell. Current price is below dynamic price.");
    return 0;
  }
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
  while (true) {
    try {
      const bitmartPrice = await fetchDynamicPrice();
      const { deskPrice, reserve1BigInt } = await fetchDeskPrice();
      console.log(`bitmartPrice:-${bitmartPrice} And deskPrice ${deskPrice} `);

      const priceDifference = ((deskPrice - bitmartPrice) / bitmartPrice) * 100;
      if (Math.abs(priceDifference) > 2 && bitmartPrice < deskPrice) {
        const getTokenBalance = async (tokenAddress, wallet) => {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ERC20_ABI,
            provider
          );
          const balance = await tokenContract.balanceOf(wallet.address);
          return ethers.formatUnits(balance, 18); // Make sure to format the balance based on the token's decimal (usually 18)
        };

        // Example usage to get the token balance
        const balanceOfAccount = await getTokenBalance(tokenAddress, wallet);
        // console.log(balanceOfAccount, "balanceOfAccount");

        const amountToSell = await calculateTokensToSell(
          bitmartPrice,
          deskPrice,
          reserve1BigInt
        );
        console.log(amountToSell, "amountToSell ----");
        const inHumanFormate = ethers.formatUnits(amountToSell, 18);

        // console.log(inHumanFormate,typeof inHumanFormate, balanceOfAccount,typeof balanceOfAccount, balanceOfAccount>inHumanFormate);

        console.log(
          inHumanFormate,
          balanceOfAccount,
          priceDifference,
          "Price And Differnec"
        );

        if (parseFloat(balanceOfAccount) > parseFloat(inHumanFormate)) {
          console.log("AFTER COMAPRING OUR BALANCE AND REQUIRED DEOD ");

          //   await sellTokens(amountToSell);
        }
      } else {
        console.log(
          `Differnce is Less then 3% and value is  ${Math.abs(
            priceDifference
          )}% Or Bitmart price greater thane Desk`
        );
      }

      // }
      await new Promise((resolve) => setTimeout(resolve, 4000));
      console.log("---------Complete Tranction-----------------");
    } catch (error) {
      console.log(error, "Errror In main");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};

// module.exports = sellCode;
sellCode();
