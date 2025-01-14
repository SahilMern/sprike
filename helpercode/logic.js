const fetchBestBidPrice = require("./bitmart");
const fetchParaswapPrice = require("./main");
// const fetchBestBidPrice = require("./spike/bitmart");
// const sellCode = require("./spike/sellCode");

// Price values from the APIs (initial prices)
const mainBot = async () => {
  const bitmartPrice = await fetchBestBidPrice();
  const dexPrice = await fetchParaswapPrice();

  console.log(bitmartPrice, dexPrice);

  // Function to check price difference
  async function checkPriceDifference() {
    try {
      const priceDifference = ((dexPrice - bitmartPrice) / bitmartPrice) * 100;

      console.log(priceDifference, "priceDifference");
      console.log(Math.abs(priceDifference) > 0.19);

      // // Check if price difference is more than 3%
      // if (Math.abs(priceDifference) >= 0.3) {
      //   console.log(
      //     "Dex ki price zyada hai. Difference: " +
      //       priceDifference.toFixed(2) +
      //       "%"
      //   );

      //   // await sellCode()
      // } else {
      //   console.log(
      //     "No price higher. Difference: " + priceDifference.toFixed(2) + "%"
      //   );
      // }

      const bitmartprice = 0.0021;
      const bitmartprice2 = 0.0022;
    } catch (error) {
      console.error("Error checking price difference:", error);
    }
  }

  console.log("------------------------------------------------------------");

  setInterval(checkPriceDifference, 5000);
};

// module.exports = mainBot;
mainBot();
