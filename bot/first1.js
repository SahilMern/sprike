// Fetch Dynamic Price from Bitmart
async function fetchDynamicPrice() {
    try {
      const response = await axios.get(
        "https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=DEOD_USDT"
      );
      if (response.status === 200) {
        const bestBidPrice = response.data.data.best_bid;
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
  
  // Calculate desk price and check if it's within 3% of Bitmart price
  const fetchDeskPrice = async () => {
    const { reserve0, reserve1 } = await fetchReserves();
  
    const reserve0BigInt = ethers.formatUnits(reserve0.toString(), 6); // Adjust decimal
    const reserve1BigInt = ethers.formatUnits(reserve1.toString(), 18); // Adjust decimal
  
    const deskPrice = reserve0BigInt / reserve1BigInt; // Price calculated on Desk
  
    return { deskPrice, reserve1BigInt };
  };
  
  // Check if deskPrice is within 3% of Bitmart Price
  const isPriceWithin3Percent = (bitmartPrice, deskPrice) => {
    const lowerLimit = bitmartPrice * 0.97;  // 3% lower than Bitmart
    const upperLimit = bitmartPrice * 1.03;  // 3% higher than Bitmart
    
    // Check if the desk price is within 3% of Bitmart's price
    return deskPrice >= lowerLimit && deskPrice <= upperLimit;
  };
  
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
  
  // Main Selling Logic
  const sellCode = async () => {
    while (true) {
      try {
        const bitmartPrice = await fetchDynamicPrice();
        const { deskPrice, reserve1BigInt } = await fetchDeskPrice();
        
        console.log(`Bitmart Price: ${bitmartPrice} And Desk Price: ${deskPrice}`);
  
        if (bitmartPrice && deskPrice) {
          const priceDifference = ((deskPrice - bitmartPrice) / bitmartPrice) * 100;
  
          // Check if the price difference is more than 3% and within acceptable range (Bitmart Price +-3%)
          if (Math.abs(priceDifference) > 3 && isPriceWithin3Percent(bitmartPrice, deskPrice)) {
            const getTokenBalance = async (tokenAddress, wallet) => {
              const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
              const balance = await tokenContract.balanceOf(wallet.address);
              return ethers.formatUnits(balance, 18); // Adjust decimals
            };
  
            // Get balance and calculate how much to sell
            const balanceOfAccount = await getTokenBalance(tokenAddress, wallet);
            const amountToSell = await calculateTokensToSell(bitmartPrice, deskPrice, reserve1BigInt);
  
            console.log(`Amount to Sell: ${amountToSell}, Account Balance: ${balanceOfAccount}`);
            
            if (parseFloat(balanceOfAccount) > parseFloat(amountToSell)) {
              await sellTokens(amountToSell);
            }
          } else {
            console.log(
              `Price difference is less than 3% or outside of acceptable range (Bitmart +-3%)`
            );
          }
        }
  
        await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait 4 seconds before next iteration
        console.log("---------Transaction Complete---------");
      } catch (error) {
        console.log("Error in main loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
  };
  
  sellCode();
  