const ethers = require("ethers");
const colors = require("colors");

const {
  factoryAddress,
  routerAddress,
  fromAddress,
  toAddress,
} = require("./constant/address");

const {
  erc20ABI,
  factoryAbi,
  pairABI,
  routerAbi,
  usdtAbi,
} = require("./constant/abi");

const approveForSell = require("./constant/approveForSell");
const SetTime = require("./models/settime.model");
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");


const MainSell = async (userDetails, sellPrice) => {
  // console.log(userDetails, sellPrice, "userDetails, sellPric");
  //!PRIVATE KEY
  //!METAMASK ADDRESS
  const signer = new ethers.Wallet(userDetails.private_Key, provider);
  console.log( signer.address,"Metamask Address for sell");

  const factoryInstance = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );

  // console.log(factoryInstance);
  const routerInstance = new ethers.Contract(routerAddress, routerAbi, signer);
  const token1 = new ethers.Contract(fromAddress, usdtAbi, signer); //usdt
  const token2 = new ethers.Contract(toAddress, erc20ABI, signer); //deod

  let getAmountOfUsdt;
  let getAmountOfDeod;

  //!FETCH PRICE FOR SELL
  const priceFetchForSell = async (amount) => {
    try {
      // throw new Error("Error In PRICE FETCHING")
      const balanceInWei = await provider.getBalance(signer.address);
      // console.log("balanceInWei", balanceInWei);

      const matic = await ethers.formatEther(balanceInWei);

      const decimal1 = await token1.decimals();
      const decimal2 = await token2.decimals();
      //   console.log("decimal2", Number(decimal2));

      const amountIn = ethers.parseUnits(amount, decimal2).toString();
      //   console.log(amountIn, "amountIn");

      amountsOut1 = await routerInstance.getAmountsOut(amountIn, [
        toAddress,
        fromAddress,
      ]);

      console.log("amountsOut1", amountsOut1);
      getAmountOfDeod = amountsOut1[0].toString();
      
      // console.log("getAmountOfDeod", getAmountOfDeod);

      getAmountOfUsdt = amountsOut1[1].toString();
      // console.log("getAmountOfUsdt", getAmountOfUsdt);

      const amountInHumanFormat = ethers.formatUnits(
        amountsOut1[1].toString(),
        decimal2
      );
      //   console.log("amountInHumanFormat", amountInHumanFormat);
    } catch (error) {
      // console.log(error.message);
      throw new Error(error.message);
    }
  };

  //TODO:- MAIN SEll FUNCTION
  const sellTokens = async () => {
    // throw new Error("error.message CHECKING");
    try {
      const getBalanceOfDeod = await token2.balanceOf(signer.address);
      // console.log("getBalanceOfDeod", getBalanceOfDeod, "line 90");

      const getBalanceOfDeodInhumanFormat = await ethers.formatEther(
        getBalanceOfDeod
      );
      // const getBalanceOfDeodInhumanFormat = getBalanceOfDeod / 10 ** 18;
      // console.log(
      //   "getBalanceOfDeodInhumanFormat",
      //   getBalanceOfDeodInhumanFormat
      // );

      const quoteOfDeodInHumanFormat = getAmountOfDeod / 10 ** 18;
      // console.log("quoteOfDeodInHumanFormat", quoteOfDeodInHumanFormat);

      // fetch Matic balance
      const balanceInWei = await provider.getBalance(signer.address);
      // console.log("balanceInWei", balanceInWei);

      const matic = await ethers.formatEther(balanceInWei);
      // console.log( matic,signer, matic >= 0.1, "User matic For Sell" );
      console.log(`User Account details ${matic},${getBalanceOfDeodInhumanFormat}`);

      if (matic >= 0.1) {
        if (getBalanceOfDeodInhumanFormat >= quoteOfDeodInHumanFormat) {
          // console.log(true);

          const sellTokens = await routerInstance.swapExactTokensForTokens(
            getAmountOfDeod,
            getAmountOfUsdt,
            [
              "0xE77aBB1E75D2913B2076DD16049992FFeACa5235",
              "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            ],
            signer.address,
            3418555736
            // {
            //   nonce: (await provider.getTransactionCount(signer.address)) + 1,
            // }
          );

          // const transaction2 = await sellTokens.wait();

          const transaction2 = await provider.waitForTransaction(
            sellTokens.hash,
            1,
            150000
          );
          console.log(transaction2.hash, "Congrullation Sell done");
        } else {
          // console.log("Insufficient Deod Amount");
          throw new Error("Insufficient Deod Amount");
        }
      } else {
        // console.log("Insufficient Matic");
        throw new Error("Insufficient Matic");
      }
    } catch (error) {
      // console.log(error.message);
      throw new Error(error.message);
    }
  };

  //TODO: CALLINNG SELL FUNCTION
  const forSell = async (sellPrice) => {
    //approve of usdt tloken to router address

    // throw new Error("Error IN FOR SELL ")
    await priceFetchForSell(sellPrice);
    // console.log("Inside", typeof sellPrice, sellPrice);
    const getAllowance = (
      await token2.allowance(signer.address, routerAddress)
    ).toString();

    const getAllowanceOfDeodInHumanFormat = getAllowance / 10 ** 18;
    // console.log(
    //   "getAllowanceOfDeodInHumanFormat",
    //   getAllowanceOfDeodInHumanFormat
    // );

    const quoteOfDeod = getAmountOfDeod.toString() / 10 ** 18;
    // console.log("quoteOfDeod", quoteOfDeod);
    const a = await signer.getNonce();
    if (getAllowanceOfDeodInHumanFormat >= quoteOfDeod) {
      try {
        console.log(colors.bgGreen("ALREADY APPROVED  For SELL "));
        await sellTokens();
      } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
      }
    } else {
      // console.log("Give more allowance");
      try {
        console.log(
          colors.bgRed("NOT approved For Sell ------------------------")
        );
        const amountForApprovalSell = (getAmountOfDeod / 10 ** 18) * 10;
        // console.log(amountForApprovalSell,"amountForApprovalSell");
        await approveForSell(userDetails, amountForApprovalSell);
        await sellTokens();
      } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
      }
    }
  };

  try {
    console.log(sellPrice, "sellPrice ---------------");
    await forSell(sellPrice);
    // throw new Error("Error In Sell ONE forSell" )
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = MainSell;
