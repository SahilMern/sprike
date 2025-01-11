// Define an async function to fetch the token price
async function fetchTokenPrice() {
    try {
      // Send the GET request to CoinGecko API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=quick&vs_currencies=DEOD');
  
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // Convert the response to JSON format
      const data = await response.json();
  
      // Extract the price from the data
      const price = data.quick.usd;
  
      // Log the price
      console.log(`Quick token price in USD: $${price}`);
    } catch (error) {
      // Catch and log any errors
      console.error('Error fetching the token price:', error);
    }
  }
  
  // Call the async function to fetch the price
  fetchTokenPrice();
  