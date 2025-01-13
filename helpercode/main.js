async function fetchParaswapPrice() {
  try {
    const url =
      "https://api.paraswap.io/prices/?srcToken=0xE77aBB1E75D2913B2076DD16049992FFeACa5235&destToken=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&network=137&partner=quickswapv3&includeDEXS=quickswap%2Cquickswapv3%2Cquickswapv3.1%2Cquickperps&srcDecimals=18&destDecimals=6&amount=1000000000000000000&side=SELL&maxImpact=15";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log("Paraswap Data:", data);
    const price = data.priceRoute.destUSD;
    return price;
    // console.log("Price:", price);

  } catch (error) {
    console.error("Error fetching Paraswap data:", error);
  }
}

// fetchParaswapPrice();
module.exports = fetchParaswapPrice;
