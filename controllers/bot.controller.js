const sellCode = require("../bot/sell");
let botStatus = require("../bot/BotStatus");
const deodprice = require("../models/setPrice.model");

const startbot = async (req, res) => {
  try {
    console.log("called");
    
    botStatus.status = true;
    sellCode();
    return res.status(200).json({
      message: "Bot start data",
    });
  } catch (error) {
    console.log(error);
  }
};
const stopbot = async (req, res) => {
  try {
    botStatus.status = false;
    return res.status(200).json({
      message: "Bot Stop data",
    });
  } catch (error) {
    console.log(error);
  }
};

const statusBot = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Bot Status",
      botStatus,
    });
  } catch (error) {
    console.log(error, "error");
  }
};

//TODO:- setPrice Set Deod Price
const setPrice = async (req, res) => {
  try {
    const { sethighdeod, setlowdeodprice } = req.body;

    // Create a new Price entry
    const newPrice = new deodprice({
      sethighdeod,
      setlowdeodprice,
    });

    // Save to MongoDB
    await newPrice.save();

    return res
      .status(201)
      .json({ message: "Price data added successfully", data: newPrice });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while saving data." });
  }
};

// API to get all price data
const getPrices = async (req, res) => {
  try {
    const prices = await deodprice.find().sort({ createdAt: -1 }).limit(1); // Limit to 1 for the latest entry

    if (!prices || prices.length === 0) {
      // Default response if no data is found
      return res.status(200).json({
        data: {
          sethighdeod: null, // Default high price
          setlowdeodprice: null, // Default low price
        },
      });
    }

    return res.status(200).json({ data: prices[0] }); // Return the most recent price data
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Something went wrong while retrieving data.",
    });
  }
};

const updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { sethighdeod, setlowdeodprice } = req.body;
    if (!sethighdeod || !setlowdeodprice) {
      return res.status(400).json({
        error: "Filed must be required",
      });
    }
    const updatedPrice = await deodprice.findByIdAndUpdate(
      id,
      { sethighdeod, setlowdeodprice },
      { new: true }
    );

    if (!updatedPrice) {
      return res.status(404).json({ message: "Price entry not found" });
    }

    return res.status(200).json({
      message: "Price entry updated successfully",
      data: updatedPrice,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while updating data." });
  }
};
module.exports = {
  startbot,
  stopbot,
  statusBot,
  setPrice,
  getPrices,
  updatePrice,
};
