const axios = require("axios"); // Import axios

// Async function to fetch the best bid price from Bitmart API
async function fetchBestBidPrice() {
  try {
    // Send a GET request to the Bitmart API
    const response = await axios.get(
      "https://api-cloud.bitmart.com/spot/v1/ticker_detail?symbol=DEOD_USDT"
    );

    // Check if the response is successful
    if (response.status === 200) {
      const bestBidPrice = response.data.data.best_bid;
      return bestBidPrice;
      console.log("Best Bid Price:", bestBidPrice);
    } else {
      console.error("Error: Could not fetch data");
    }
  } catch (error) {
    // Catch any errors (network issues, invalid response, etc.)
    console.error("Error fetching Bitmart data:", error);
  }
}

// Call the fetchBestBidPrice function
// fetchBestBidPrice();

module.exports = fetchBestBidPrice