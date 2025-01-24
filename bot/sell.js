const dotenv = require("dotenv").config({});
const axios = require("axios");
const { ethers } = require("ethers");
const botStatus = require("./BotStatus");

const deodprice = require("../models/setPrice.model");
let colors = require("colors");

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
// const provider = new ethers.JsonRpcProvider("https://polygon-pokt.nodies.app");

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

const fetchDeskPrice = async () => {
  const { reserve0, reserve1 } = await fetchReserves();
  const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6);
  const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18);
  const deskPrice = reserve0BigInt / reserve1BigInt;
  return { deskPrice, reserve1BigInt };
};

//TODO:-My Token
const getTokenBalance = async (tokenAddress, wallet) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await tokenContract.balanceOf(wallet.address);
  return ethers.formatUnits(balance, 18);
};

//TODO:-Calculating How much to sell
//!How Much To Sell
async function calculateTokensToSell(
  setDeodLowPrice,
  deskPrice,
  reserve1BigInt1
) {
  // console.log(
  //   setDeodLowPrice,
  //   deskPrice,
  //   reserve1BigInt1,
  //   "Calculate parameter"
  // );

  const amountToSell =
    (reserve1BigInt1 * (deskPrice - setDeodLowPrice)) /
    (deskPrice + setDeodLowPrice);
  return ethers.parseEther(amountToSell.toString());
}

async function sellTokens(amountToSell) {
  console.log(amountToSell, "Acutal value in deod sell");
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

      const approveTx = await tokenContract.approve(
        routerAddress,
        amountToSell
      );
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
      console.log("No Deod To Sell 🥲");
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}


const sellCode = async () => {
  while (botStatus.status) {
    try {
      const prices = await deodprice.find().sort({ createdAt: -1 }).limit(1);
      let { deskPrice, reserve1BigInt } = await fetchDeskPrice();
      let setDeodHighPrice = prices[0].sethighdeod;
      let setDeodLowPrice = parseFloat(deskPrice.toFixed(6));
      
      // 0.002914653919208312
      // deskPrice = 0.002913;
      // setDeodHighPrice = 0.002912;
      // setDeodLowPrice = 0.00269;


      console.log(deskPrice, setDeodHighPrice, setDeodLowPrice, "comparing");

      // console.log(
      //   deskPrice > setDeodHighPrice,
      //   deskPrice,
      //   typeof deskPrice,
      //   setDeodHighPrice,
      //   typeof setDeodHighPrice
      // );

      if (deskPrice > setDeodHighPrice) {
        console.log("PRICE Braek The  RANGE ".bgRed);

        const balanceOfAccount = await getTokenBalance(tokenAddress, wallet);
        console.log(balanceOfAccount, "My Balance ------".bgRed);

        const amountToSell = await calculateTokensToSell(
          setDeodHighPrice,
          deskPrice,
          reserve1BigInt
        );
        // console.log(amountToSell, "amountToSell ----");
        const inHumanFormate = ethers.formatUnits(amountToSell, 18);
        console.log(inHumanFormate, "Value In Human Formate");

        // if (parseFloat(balanceOfAccount) > parseFloat(inHumanFormate)) {
        //   console.log("AFTER COMAPRING OUR BALANCE AND REQUIRED DEOD ");
        //   if (inHumanFormate > balanceOfAccount) {
        //     console.log("balance is high");
        //     await sellTokens(balanceOfAccount);
        //   }
        //   // await sellTokens(amountToSell);
        // }
       
        
           if (parseFloat(inHumanFormate) > parseFloat(balanceOfAccount)) {
            console.log("Balance is low compare to selling");
            const data = ethers.parseUnits(balanceOfAccount.toString(),18); 
            await sellTokens(data);
          }else{
            console.log("Balance is High and Selling amount is low ")
            await sellTokens(amountToSell);
          }

      } else {
        console.log("Price Is In range");
      }

      await new Promise((resolve) => setTimeout(resolve, 12000));
      console.log("---------Complete Tranction-----------------");
    } catch (error) {
      console.log(error, "Errror In main");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};

module.exports = sellCode;
